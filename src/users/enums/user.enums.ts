export enum ROLE {
  student = 0,
  instructor = 1,
  accountant = 2,
  operator = 3,
  admin = 4,
  superAdmin = 5,
}

export enum USER_STATUS {
  notVerified = 0,
  verified = 1,
  disabled = 3,
}

export enum PASSWORD_VERSION {
  sha1 = 1,
  sha256 = 2,
}

export enum KYC_DOCUMENT_TYPE {
  NID = 'NID',
  BIRTH_CERTIFICATE = 'birthCertificate',
  PASSPORT = 'passport',
}