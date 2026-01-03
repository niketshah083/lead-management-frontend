import { ICategory } from './category.model';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  CUSTOMER_EXECUTIVE = 'customer_executive',
}

export interface IUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole | string;
  managerId?: string;
  manager?: IUser;
  categories?: ICategory[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateUser {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: UserRole | string;
  managerId?: string;
}

export interface IUpdateUser {
  name?: string;
  phone?: string;
  role?: UserRole | string;
  managerId?: string;
  isActive?: boolean;
}

export interface ILoginCredentials {
  email: string;
  password: string;
}

export interface ITokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  user: IUser;
}
