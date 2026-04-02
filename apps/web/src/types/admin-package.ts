export type AdminPackage = {
  id: string;
  packageId: string;
  name: string;
  description: string;
  activityIds: string[];
  coverImageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminPackageInput = Omit<AdminPackage, 'id' | 'packageId' | 'createdAt' | 'updatedAt'> & {
  packageId?: string;
};

