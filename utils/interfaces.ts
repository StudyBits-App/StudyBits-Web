export interface Answer {
  key: string;
  content: string;
  answer: boolean;
}

export interface Hint {
  key: string;
  title: string;
  content: string;
  image: File | null;
}

export interface HintUpload {
  key: string;
  title: string;
  content: string;
  image: string;
}

export interface Course {
  key: string;
  creator: string;
  picUrl: string;
  name: string;
  description: string;
  lastModified: number;
}

export interface Unit {
  key: string;
  name: string;
  description: string;
  order: number;
}
