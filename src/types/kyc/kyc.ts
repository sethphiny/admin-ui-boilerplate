export enum KycStatus {
  INITIATED = 'initiated',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export interface KycSession {
  id: string;
  sessionId: string;
  a7BusinessId: string;
  businessName: string;
  country: string;
  status: KycStatus;
  expiresAt: string;
  verifiedAt?: string;
  rejectionReason?: string;
  createdOn: string;
  updatedOn: string;
  kycData?: {
    id: string;
    sessionId: string;
    companyData: any;
    directorsData: any;
    idCards?: any;
    bvn?: string;
    isBvnVerified?: boolean;
    createdOn: string;
    updatedOn: string;
  };
}

export interface KycSessionsResponse {
  data: KycSession[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
