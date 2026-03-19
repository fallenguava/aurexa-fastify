import {
  type TDocumentDefinitions,
  type TFontDictionary,
  type Content,
} from "pdfmake/interfaces";
import { PocketRepository } from "../repositories/PocketRepository";
import { TransactionRepository } from "../repositories/TransactionRepository";
import { SnapshotRepository } from "../repositories/SnapshotRepository";
import { UserRepository } from "../repositories/UserRepository";
import { ProjectRepository } from "../repositories/ProjectRepository";
import { CategoryRepository } from "../repositories/CategoryRepository";
import { type Transaction } from "../entities/Transaction";
import { type Pocket } from "../entities/Pocket";
import { supabase } from "../utils/supabase";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PdfPrinter = require("pdfmake/js/Printer").default as new (
  fonts: TFontDictionary,
  virtualfs: object,
  urlResolver: object,
) => {
  createPdfKitDocument(
    docDefinition: TDocumentDefinitions,
  ): Promise<NodeJS.EventEmitter & { end(): void }>;
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const vfs = require("pdfmake/js/virtual-fs").default as object;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const URLResolver = require("pdfmake/js/URLResolver").default as new (
  fs: object,
) => object;

const pocketRepository = new PocketRepository();
const transactionRepository = new TransactionRepository();
const snapshotRepository = new SnapshotRepository();
const userRepository = new UserRepository();
const projectRepository = new ProjectRepository();
const categoryRepository = new CategoryRepository();

const FONTS: TFontDictionary = {
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
};

function padTwo(n: number): string {
  return String(n).padStart(2, "0");
}

function formatCurrency(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

async function buildPdfBuffer(
  pocket: Pocket,
  month: number,
  year: number,
  startingBalance: number,
  endingBalance: number,
  totalIncome: number,
  totalExpenses: number,
  transactions: Transaction[],
  username: string,
  projectMap: Record<string, string>,
  categoryMap: Record<string, string>,
): Promise<Buffer> {
  const monthName = new Date(year, month - 1, 1).toLocaleString("default", {
    month: "long",
  });

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Group transactions by project_id; null → "__general__"
  const groups = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const key = t.project_id ?? "__general__";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }

  // Named project keys first, "General" last
  const orderedKeys = [
    ...Array.from(groups.keys()).filter((k) => k !== "__general__"),
    ...(groups.has("__general__") ? ["__general__"] : []),
  ];

  const projectSections: Content[] = [];
  if (transactions.length === 0) {
    projectSections.push({
      text: "No transactions for this period.",
      italics: true,
      color: "#94a3b8",
      margin: [0, 8, 0, 0],
    });
  } else {
    for (const key of orderedKeys) {
      const projectName =
        key === "__general__"
          ? "General"
          : (projectMap[key] ?? "Project (deleted)");
      const txList = groups.get(key)!;
      const rows = txList.map((t) => [
        { text: t.date, style: "tableCell" },
        { text: t.title, style: "tableCell" },
        {
          text: categoryMap[t.category_id] ?? "Category (deleted)",
          style: "tableCell",
        },
        {
          text: t.type === "INCOMING" ? "Income" : "Expense",
          style: t.type === "INCOMING" ? "incoming" : "outcoming",
        },
        {
          text: `${t.type === "INCOMING" ? "+" : "-"}${formatCurrency(t.amount)}`,
          style: t.type === "INCOMING" ? "incoming" : "outcoming",
          alignment: "right" as const,
        },
      ]);

      projectSections.push(
        {
          text: projectName,
          style: "projectHeader",
          margin: [0, 16, 0, 8],
        } as Content,
        {
          table: {
            widths: ["auto", "*", "auto", "auto", "auto"],
            headerRows: 1,
            body: [
              [
                { text: "Date", style: "tableHeader" },
                { text: "Description", style: "tableHeader" },
                { text: "Category", style: "tableHeader" },
                { text: "Type", style: "tableHeader" },
                { text: "Amount", style: "tableHeader", alignment: "right" },
              ],
              ...rows,
            ],
          },
          layout: {
            hLineWidth: function (i, node) {
              return i === 0 || i === node.table.body.length ? 0 : 0.5;
            },
            vLineWidth: function () {
              return 0;
            },
            hLineColor: function () {
              return "#e2e8f0";
            },
            paddingLeft: function () {
              return 8;
            },
            paddingRight: function () {
              return 8;
            },
            paddingTop: function () {
              return 6;
            },
            paddingBottom: function () {
              return 6;
            },
          },
          margin: [0, 0, 0, 24],
        } as Content,
      );
    }
  }

  const docDefinition: TDocumentDefinitions = {
    defaultStyle: {
      font: "Helvetica",
      fontSize: 10,
      lineHeight: 1.4,
    },
    pageMargins: [40, 60, 40, 60],
    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        {
          text: `${pocket.name} · Generated by ${username}`,
          alignment: "left",
          fontSize: 8,
          color: "#94a3b8",
          margin: [40, 20, 0, 0],
        },
        {
          text: `Page ${currentPage} of ${pageCount}`,
          alignment: "right",
          fontSize: 8,
          color: "#94a3b8",
          margin: [0, 20, 40, 0],
        },
      ],
    }),
    content: [
      // Header
      {
        stack: [
          {
            text: `${monthName} ${year}`,
            style: "reportTitle",
          },
          {
            text: pocket.name,
            style: "reportSubtitle",
          },
          {
            columns: [
              {
                text: `Generated ${currentDate}`,
                style: "reportMeta",
                alignment: "left",
              },
              {
                text: username,
                style: "reportMeta",
                alignment: "right",
              },
            ],
            margin: [0, 8, 0, 24],
          },
        ],
        alignment: "center",
      },

      // Summary Cards
      {
        columns: [
          {
            stack: [
              { text: "Starting Balance", style: "summaryLabel" },
              { text: formatCurrency(startingBalance), style: "summaryValue" },
            ],
            alignment: "center",
          },
          {
            stack: [
              { text: "Total Income", style: "summaryLabel" },
              { text: `+${formatCurrency(totalIncome)}`, style: "incomeValue" },
            ],
            alignment: "center",
          },
          {
            stack: [
              { text: "Total Expenses", style: "summaryLabel" },
              {
                text: `-${formatCurrency(totalExpenses)}`,
                style: "expenseValue",
              },
            ],
            alignment: "center",
          },
          {
            stack: [
              { text: "Ending Balance", style: "summaryLabel" },
              {
                text: formatCurrency(endingBalance),
                style: "summaryValueBold",
              },
            ],
            alignment: "center",
          },
        ],
        columnGap: 16,
        margin: [0, 0, 0, 32],
      },

      // Divider
      {
        canvas: [
          {
            type: "line",
            x1: 0,
            y1: 0,
            x2: 515,
            y2: 0,
            lineWidth: 1,
            lineColor: "#e2e8f0",
          },
        ],
        margin: [0, 0, 0, 24],
      },

      // Transactions Section
      {
        text: "Transaction Details",
        style: "sectionHeader",
        margin: [0, 0, 0, 16],
      },
      ...projectSections,
    ] as Content[],
    styles: {
      reportTitle: {
        fontSize: 28,
        bold: true,
        color: "#0f172a",
        margin: [0, 0, 0, 4],
      },
      reportSubtitle: {
        fontSize: 14,
        color: "#475569",
        margin: [0, 4, 0, 8],
      },
      reportMeta: {
        fontSize: 9,
        color: "#64748b",
      },
      summaryLabel: {
        fontSize: 10,
        color: "#64748b",
        margin: [0, 0, 0, 4],
      },
      summaryValue: {
        fontSize: 16,
        bold: true,
        color: "#0f172a",
      },
      summaryValueBold: {
        fontSize: 16,
        bold: true,
        color: "#0f172a",
      },
      incomeValue: {
        fontSize: 16,
        bold: true,
        color: "#059669",
      },
      expenseValue: {
        fontSize: 16,
        bold: true,
        color: "#dc2626",
      },
      sectionHeader: {
        fontSize: 14,
        bold: true,
        color: "#0f172a",
      },
      projectHeader: {
        fontSize: 12,
        bold: true,
        color: "#1e293b",
      },
      tableHeader: {
        bold: true,
        color: "#475569",
        fontSize: 9,
        fillColor: "#f8fafc",
      },
      tableCell: {
        fontSize: 9,
        color: "#334155",
      },
      incoming: {
        color: "#059669",
        fontSize: 9,
        bold: true,
      },
      outcoming: {
        color: "#dc2626",
        fontSize: 9,
        bold: true,
      },
    },
  };

  const printer = new PdfPrinter(FONTS, vfs, new URLResolver(vfs));
  const pdfDoc = await printer.createPdfKitDocument(docDefinition);

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    pdfDoc.on("data", (chunk: Buffer) => chunks.push(chunk));
    pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
    pdfDoc.on("error", reject);
    pdfDoc.end();
  });
}

export const ReportService = {
  async generateMonthlyReport(
    userId: string,
    pocketId: string,
    month: number,
    year: number,
  ): Promise<string> {
    const pocket = await pocketRepository.findUserPocketById(pocketId, userId);
    if (!pocket) {
      throw new Error("Invalid Pocket");
    }

    const [user, projects, categories] = await Promise.all([
      userRepository.findById(userId),
      projectRepository.findByPocketId(pocketId),
      categoryRepository.findByUserId(userId),
    ]);

    const username = user?.username ?? "Unknown";

    const projectMap: Record<string, string> = {};
    for (const p of projects) projectMap[p.id] = p.name;

    const categoryMap: Record<string, string> = {};
    for (const c of categories) categoryMap[c.id] = c.name;

    const lastDay = lastDayOfMonth(year, month);
    const targetMonthStart = `${year}-${padTwo(month)}-01`;
    const targetMonthEnd = `${year}-${padTwo(month)}-${padTwo(lastDay)}`;

    let startingBalance: number;
    let endingBalance: number;
    let monthTransactions: Transaction[];

    const existingSnapshot = await snapshotRepository.findSnapshot(
      pocketId,
      year,
      month,
    );

    if (existingSnapshot?.is_locked) {
      startingBalance = existingSnapshot.starting_balance;
      endingBalance = existingSnapshot.ending_balance;
      monthTransactions = await transactionRepository.findByDateRange(
        pocketId,
        targetMonthStart,
        targetMonthEnd,
      );
    } else {
      const futureTransactions = await transactionRepository.findAfterDate(
        pocketId,
        targetMonthEnd,
      );
      monthTransactions = await transactionRepository.findByDateRange(
        pocketId,
        targetMonthStart,
        targetMonthEnd,
      );

      // Reverse future transactions from current_balance to derive ending_balance
      const futureDelta = futureTransactions.reduce((acc, t) => {
        return t.type === "INCOMING" ? acc - t.amount : acc + t.amount;
      }, 0);
      endingBalance = pocket.current_balance + futureDelta;

      // Reverse this month's transactions from ending_balance to derive starting_balance
      const monthDelta = monthTransactions.reduce((acc, t) => {
        return t.type === "INCOMING" ? acc - t.amount : acc + t.amount;
      }, 0);
      startingBalance = endingBalance + monthDelta;

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const isPast =
        year < currentYear || (year === currentYear && month < currentMonth);

      await snapshotRepository.upsertSnapshot({
        pocket_id: pocketId,
        year,
        month,
        starting_balance: startingBalance,
        ending_balance: endingBalance,
        is_locked: isPast,
      });
    }

    const totalIncome = monthTransactions
      .filter((t) => t.type === "INCOMING")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = monthTransactions
      .filter((t) => t.type === "OUTCOMING")
      .reduce((sum, t) => sum + t.amount, 0);

    const pdfBuffer = await buildPdfBuffer(
      pocket,
      month,
      year,
      startingBalance,
      endingBalance,
      totalIncome,
      totalExpenses,
      monthTransactions,
      username,
      projectMap,
      categoryMap,
    );

    const storagePath = `${userId}/${pocketId}/${year}_${padTwo(month)}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("monthly_reports")
      .upload(storagePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload report: ${uploadError.message}`);
    }

    const { data: signedData, error: signedError } = await supabase.storage
      .from("monthly_reports")
      .createSignedUrl(storagePath, 3600);

    if (signedError ?? !signedData) {
      throw new Error(
        `Failed to generate signed URL: ${signedError?.message ?? "unknown error"}`,
      );
    }

    return signedData.signedUrl;
  },
};
