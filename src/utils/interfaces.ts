export interface Channel {
    courses: string[];
    bannerURL: string;
    profilePicURL: string;
    displayName: string;
}

export const defaultChannel: Channel = {
    courses: [],
    bannerURL: '',
    profilePicURL: '',
    displayName: '',
};

export interface Course {
    key: string;
    creator: string;
    picUrl: string;
    name: string;
    description: string;
    lastModified: number
}

export interface Answer {
    key: string;
    content: string,
    answer: boolean,
}

export interface Hint {
    key: string;
    title: string;
    content: string;
    image: string;
  }