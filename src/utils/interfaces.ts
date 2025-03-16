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