export interface Resource {
  id: string;
  title: string;
  description: string;
  type: "ppt" | "video";
  file_url: string;
  tags: string[];
  created_at: string;
}

export interface ResourceResponse {
  id: string;
  title: string;
  type: "ppt" | "video";
  url: string;
}

export interface AskJijiRequest {
  query: string;
}

export interface AskJijiData {
  answer: string;
  resources: ResourceResponse[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Profile {
  id: string;
  email: string;
  created_at: string;
}

export interface Query {
  id: string;
  user_id: string;
  query_text: string;
  created_at: string;
}
