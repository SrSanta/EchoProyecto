import { Role } from "./role.model";

export interface User {
  id?: number;
  username: string;
  password?: string;
  email: string;
  roles?: Role[];
  registrationDate?: string;
  isProfilePublic?: boolean;
  profileImage?: string;
}
