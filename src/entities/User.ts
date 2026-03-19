export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  type: "REG" | "ADM";
  verified: boolean;
  base_currency: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateUserDTO {
  username: string;
  email: string;
  password: string;
}
