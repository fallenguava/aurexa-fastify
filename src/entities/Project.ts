export interface Project {
  id: string;
  pocket_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateProjectDTO {
  name: string;
  pocket_id: string;
}

export interface UpdateProjectDTO {
  name: string;
}
