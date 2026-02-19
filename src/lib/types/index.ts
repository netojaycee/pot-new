export type GuestSessionType = {
  sessionId: string;
  isGuest: true;
  expires: Date;
};

export type UserSessionType = {
  userId: string;
  role: string;
  expires: Date;
};