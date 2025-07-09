export interface Answer {
  key: string;
  content: string;
  answer: boolean;
}

export interface Hint {
  key: string;
  title: string;
  content: string;
  image: File | null | string;
}
export interface Course {
  key: string;
  creator: string;
  picUrl: string;
  name: string;
  description: string;
  lastModified: number;
}

export const defaultCourse: Course = {
  key: "",
  creator: "",
  picUrl: "",
  name: "",
  description: "",
  lastModified: new Date().getTime(),
};

export interface Unit {
  key: string;
  name: string;
  description: string;
  order: number;
}

export interface Channel {
  courses: string[];
  bannerURL: string;
  profilePicURL: string;
  displayName: string;
}

export interface Question {
  id: string;
  question: string;
  hints: Hint[];
  answers: Answer[];
  course: string;
  unit: string;
}

export interface EditingQuestion {
  id: string;
  question: string;
  hints: Hint[];
  oldHints: Hint[];
  answers: Answer[];
  course: string;
  unit: string;
  oldCourse: string;
  oldUnit: string
}