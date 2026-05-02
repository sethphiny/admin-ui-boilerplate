export interface Partner {
  id: string;
  name: string;
  clientId: string;
  clientSecret?: string;
  webhookSecret?: string;
  isActive: boolean;
  createdOn: string;
  updatedOn: string;
}

export interface CreatePartnerDto {
  name: string;
  clientId: string;
  clientSecret: string;
  webhookSecret?: string;
}

export interface UpdatePartnerDto {
  name?: string;
  isActive?: boolean;
  webhookSecret?: string;
}
