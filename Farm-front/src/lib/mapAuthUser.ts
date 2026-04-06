import type { KycDocumentItem, NotificationPreferences, User } from '@/types';

const defaultNotificationPreferences: NotificationPreferences = {
  emailNotifications: true,
  pushNotifications: true,
  orderUpdates: true,
  messageNotifications: true,
  reviewNotifications: true,
  promotionalEmails: false,
};

function mergeNotificationPreferences(raw: unknown): NotificationPreferences {
  if (!raw || typeof raw !== 'object') {
    return { ...defaultNotificationPreferences };
  }
  const p = raw as Record<string, unknown>;
  const next = { ...defaultNotificationPreferences };
  (Object.keys(defaultNotificationPreferences) as (keyof NotificationPreferences)[]).forEach((k) => {
    if (typeof p[k] === 'boolean') next[k] = p[k];
  });
  return next;
}

function mapKycDocuments(raw: unknown): KycDocumentItem[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  return raw.map((d: any) => ({
    id: d._id != null ? String(d._id) : d.id,
    docType: d.docType,
    fileUrl: d.fileUrl,
    originalName: d.originalName,
    uploadedAt:
      typeof d.uploadedAt === 'string'
        ? d.uploadedAt
        : d.uploadedAt instanceof Date
          ? d.uploadedAt.toISOString()
          : undefined,
    reviewStatus: d.reviewStatus || 'pending',
  }));
}

/** Map GET /users/profile or auth response user into Redux `User` shape */
export function mapApiUserToAuth(user: Record<string, any>): User {
  return {
    id: user._id || user.id,
    name: user.name,
    email: user.email || '',
    phone: user.phone ?? '',
    role: user.role,
    avatar: user.avatar,
    isVerified: user.kycStatus === 'approved',
    kycStatus: user.kycStatus || 'pending',
    location: {
      state: user.location?.state || '',
      district: user.location?.district || '',
      village: user.location?.village || '',
    },
    createdAt: user.createdAt || new Date().toISOString(),
    businessName: user.businessName,
    businessType: user.businessType,
    gstNumber: user.gstNumber,
    businessAddress: user.businessAddress,
    farmSize: user.farmSize,
    crops: user.crops,
    calendarHighlightCategories: Array.isArray(user.calendarHighlightCategories)
      ? user.calendarHighlightCategories
      : undefined,
    bio: user.bio,
    kycDocuments: mapKycDocuments(user.kycDocuments),
    accountStatus:
      user.accountStatus === 'suspended' || user.accountStatus === 'active'
        ? user.accountStatus
        : 'active',
    kycRejectionReason:
      typeof user.kycRejectionReason === 'string' ? user.kycRejectionReason : undefined,
    notificationPreferences: mergeNotificationPreferences(user.notificationPreferences),
  };
}
