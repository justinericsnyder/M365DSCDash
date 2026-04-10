// Realistic Microsoft 365 DSC demo data
// Simulates an Export-M365DSCConfiguration JSON report from a real tenant

export const M365_TENANT = {
  tenantId: "contoso-corp-2026",
  tenantName: "contoso.onmicrosoft.com",
  displayName: "Contoso Corporation",
  defaultDomain: "contoso.com",
};

// M365DSC JSON report format: array of resources grouped by workload
// Each resource has ResourceName (the DSC resource type) and properties
export const m365ExportData = [
  // ─── AAD / Entra ID ──────────────────────────────────
  {
    workload: "AAD" as const,
    resourceType: "AADConditionalAccessPolicy",
    resources: [
      {
        displayName: "Require MFA for All Users",
        primaryKey: "Require MFA for All Users",
        properties: {
          DisplayName: "Require MFA for All Users",
          State: "enabled",
          IncludeUsers: ["All"],
          ExcludeUsers: ["BreakGlassAccount@contoso.com"],
          IncludeApplications: ["All"],
          GrantControlOperator: "OR",
          BuiltInControls: ["mfa"],
          Ensure: "Present",
        },
        status: "COMPLIANT" as const,
      },
      {
        displayName: "Block Legacy Authentication",
        primaryKey: "Block Legacy Authentication",
        properties: {
          DisplayName: "Block Legacy Authentication",
          State: "enabled",
          IncludeUsers: ["All"],
          ClientAppTypes: ["exchangeActiveSync", "other"],
          BuiltInControls: ["block"],
          Ensure: "Present",
        },
        status: "COMPLIANT" as const,
      },
      {
        displayName: "Require Compliant Device for Office 365",
        primaryKey: "Require Compliant Device for Office 365",
        properties: {
          DisplayName: "Require Compliant Device for Office 365",
          State: "enabled",
          IncludeUsers: ["All"],
          IncludeApplications: ["Office365"],
          BuiltInControls: ["compliantDevice"],
          Ensure: "Present",
        },
        status: "DRIFTED" as const,
        desiredState: { State: "enabled", BuiltInControls: ["compliantDevice"] },
        actualState: { State: "enabledForReportingButNotEnforced", BuiltInControls: ["compliantDevice"] },
        differingProperties: ["State"],
      },
      {
        displayName: "Block High Risk Sign-Ins",
        primaryKey: "Block High Risk Sign-Ins",
        properties: {
          DisplayName: "Block High Risk Sign-Ins",
          State: "enabled",
          IncludeUsers: ["All"],
          SignInRiskLevels: ["high"],
          BuiltInControls: ["block"],
          Ensure: "Present",
        },
        status: "COMPLIANT" as const,
      },
      {
        displayName: "Require MFA for Azure Management",
        primaryKey: "Require MFA for Azure Management",
        properties: {
          DisplayName: "Require MFA for Azure Management",
          State: "enabled",
          IncludeUsers: ["All"],
          IncludeApplications: ["MicrosoftAdminPortals"],
          BuiltInControls: ["mfa"],
          Ensure: "Present",
        },
        status: "COMPLIANT" as const,
      },
    ],
  },
  {
    workload: "AAD" as const,
    resourceType: "AADGroupsNamingPolicy",
    resources: [
      {
        displayName: "Group Naming Policy",
        primaryKey: "GroupNamingPolicy",
        properties: {
          IsSingleInstance: "Yes",
          PrefixSuffixNamingRequirement: "[Department]_[GroupName]",
          CustomBlockedWordsList: ["CEO", "Payroll", "HR_Confidential"],
          Ensure: "Present",
        },
        status: "COMPLIANT" as const,
      },
    ],
  },
  {
    workload: "AAD" as const,
    resourceType: "AADGroupsSettings",
    resources: [
      {
        displayName: "Groups Settings",
        primaryKey: "GroupsSettings",
        properties: {
          IsSingleInstance: "Yes",
          EnableGroupCreation: false,
          GroupCreationAllowedGroupName: "SG-AllowGroupCreation",
          AllowGuestsToAccessGroups: true,
          UsageGuidelinesUrl: "https://contoso.com/groups-policy",
          Ensure: "Present",
        },
        status: "DRIFTED" as const,
        desiredState: { EnableGroupCreation: false },
        actualState: { EnableGroupCreation: true },
        differingProperties: ["EnableGroupCreation"],
      },
    ],
  },
  {
    workload: "AAD" as const,
    resourceType: "AADAuthenticationMethodPolicyAuthenticator",
    resources: [
      {
        displayName: "Microsoft Authenticator",
        primaryKey: "MicrosoftAuthenticator",
        properties: {
          Id: "MicrosoftAuthenticator",
          State: "enabled",
          IsSoftwareOathEnabled: false,
          FeatureSettings: {
            DisplayAppInformationRequiredState: "enabled",
            DisplayLocationInformationRequiredState: "enabled",
          },
          Ensure: "Present",
        },
        status: "COMPLIANT" as const,
      },
    ],
  },
  {
    workload: "AAD" as const,
    resourceType: "AADRoleDefinition",
    resources: [
      {
        displayName: "Helpdesk Tier 1",
        primaryKey: "Helpdesk Tier 1",
        properties: {
          DisplayName: "Helpdesk Tier 1",
          Description: "Custom role for Tier 1 helpdesk staff",
          IsEnabled: true,
          RolePermissions: ["microsoft.directory/users/password/update", "microsoft.directory/users/basicProfile/update"],
          Ensure: "Present",
        },
        status: "COMPLIANT" as const,
      },
    ],
  },

  // ─── Exchange Online ──────────────────────────────────
  {
    workload: "EXO" as const,
    resourceType: "EXOOrganizationConfig",
    resources: [
      {
        displayName: "Exchange Organization Config",
        primaryKey: "EXOOrganizationConfig",
        properties: {
          IsSingleInstance: "Yes",
          AuditDisabled: false,
          DefaultPublicFolderAgeLimit: "365.00:00:00",
          AutoExpandingArchive: true,
          ConnectorsEnabled: true,
          EwsEnabled: true,
          OAuth2ClientProfileEnabled: true,
          SmtpActionableMessagesEnabled: true,
          Ensure: "Present",
        },
        status: "COMPLIANT" as const,
      },
    ],
  },
  {
    workload: "EXO" as const,
    resourceType: "EXOAntiPhishPolicy",
    resources: [
      {
        displayName: "Strict Anti-Phish Policy",
        primaryKey: "Strict Anti-Phish Policy",
        properties: {
          Identity: "Strict Anti-Phish Policy",
          Enabled: true,
          PhishThresholdLevel: 3,
          EnableMailboxIntelligenceProtection: true,
          EnableSpoofIntelligence: true,
          EnableFirstContactSafetyTips: true,
          EnableSimilarUsersSafetyTips: true,
          AuthenticationFailAction: "Quarantine",
          SpoofQuarantineTag: "DefaultFullAccessPolicy",
          Ensure: "Present",
        },
        status: "COMPLIANT" as const,
      },
    ],
  },
  {
    workload: "EXO" as const,
    resourceType: "EXOAntiMalwarePolicy",
    resources: [
      {
        displayName: "Default Anti-Malware Policy",
        primaryKey: "Default",
        properties: {
          Identity: "Default",
          EnableFileFilter: true,
          FileTypeAction: "Reject",
          ZapEnabled: true,
          EnableInternalSenderAdminNotifications: true,
          InternalSenderAdminAddress: "secops@contoso.com",
          Ensure: "Present",
        },
        status: "DRIFTED" as const,
        desiredState: { EnableInternalSenderAdminNotifications: true, InternalSenderAdminAddress: "secops@contoso.com" },
        actualState: { EnableInternalSenderAdminNotifications: false, InternalSenderAdminAddress: "" },
        differingProperties: ["EnableInternalSenderAdminNotifications", "InternalSenderAdminAddress"],
      },
    ],
  },
  {
    workload: "EXO" as const,
    resourceType: "EXOSafeLinksPolicy",
    resources: [
      {
        displayName: "Contoso Safe Links",
        primaryKey: "Contoso Safe Links",
        properties: {
          Identity: "Contoso Safe Links",
          IsEnabled: true,
          ScanUrls: true,
          EnableForInternalSenders: true,
          DeliverMessageAfterScan: true,
          DisableUrlRewrite: false,
          TrackClicks: true,
          Ensure: "Present",
        },
        status: "COMPLIANT" as const,
      },
    ],
  },
  {
    workload: "EXO" as const,
    resourceType: "EXOTransportRule",
    resources: [
      {
        displayName: "External Email Warning",
        primaryKey: "External Email Warning",
        properties: {
          Name: "External Email Warning",
          State: "Enabled",
          FromScope: "NotInOrganization",
          PrependSubject: "[EXTERNAL] ",
          Priority: 0,
          Ensure: "Present",
        },
        status: "COMPLIANT" as const,
      },
      {
        displayName: "Block Auto-Forward to External",
        primaryKey: "Block Auto-Forward to External",
        properties: {
          Name: "Block Auto-Forward to External",
          State: "Enabled",
          MessageTypeMatches: "AutoForward",
          SentToScope: "NotInOrganization",
          RejectMessageReasonText: "Auto-forwarding to external recipients is not allowed.",
          Priority: 1,
          Ensure: "Present",
        },
        status: "COMPLIANT" as const,
      },
    ],
  },

  // ─── SharePoint Online ────────────────────────────────
  {
    workload: "SPO" as const,
    resourceType: "SPOTenantSettings",
    resources: [
      {
        displayName: "SPO Tenant Settings",
        primaryKey: "SPOTenantSettings",
        properties: {
          IsSingleInstance: "Yes",
          SharingCapability: "ExternalUserSharingOnly",
          ShowEveryoneClaim: false,
          ShowEveryoneExceptExternalUsersClaim: true,
          RequireAcceptingAccountMatchInvitedAccount: true,
          DefaultSharingLinkType: "Internal",
          PreventExternalUsersFromResharing: true,
          OneDriveStorageQuota: 1048576,
          Ensure: "Present",
        },
        status: "DRIFTED" as const,
        desiredState: { SharingCapability: "ExternalUserSharingOnly", PreventExternalUsersFromResharing: true },
        actualState: { SharingCapability: "ExternalUserAndGuestSharing", PreventExternalUsersFromResharing: false },
        differingProperties: ["SharingCapability", "PreventExternalUsersFromResharing"],
      },
    ],
  },
  {
    workload: "SPO" as const,
    resourceType: "SPOSharingSettings",
    resources: [
      {
        displayName: "SPO Sharing Settings",
        primaryKey: "SPOSharingSettings",
        properties: {
          IsSingleInstance: "Yes",
          SharingDomainRestrictionMode: "AllowList",
          SharingAllowedDomainList: ["partner.com", "vendor.com"],
          RequireAnonymousLinksExpireInDays: 30,
          DefaultLinkPermission: "View",
          Ensure: "Present",
        },
        status: "COMPLIANT" as const,
      },
    ],
  },

  // ─── Microsoft Teams ──────────────────────────────────
  {
    workload: "TEAMS" as const,
    resourceType: "TeamsClientConfiguration",
    resources: [
      {
        displayName: "Teams Client Configuration",
        primaryKey: "Global",
        properties: {
          Identity: "Global",
          AllowBox: false,
          AllowDropBox: false,
          AllowGoogleDrive: false,
          AllowShareFile: false,
          AllowEgnyte: false,
          AllowEmailIntoChannel: true,
          AllowOrganizationTab: true,
          AllowResourceAccountSendMessage: true,
          Ensure: "Present",
        },
        status: "COMPLIANT" as const,
      },
    ],
  },
  {
    workload: "TEAMS" as const,
    resourceType: "TeamsMeetingPolicy",
    resources: [
      {
        displayName: "Global Meeting Policy",
        primaryKey: "Global",
        properties: {
          Identity: "Global",
          AllowAnonymousUsersToJoinMeeting: false,
          AllowExternalParticipantGiveRequestControl: false,
          AllowCloudRecording: true,
          AllowTranscription: true,
          ScreenSharingMode: "EntireScreen",
          AllowPrivateMeetingScheduling: true,
          AutoAdmittedUsers: "EveryoneInCompanyExcludingGuests",
          Ensure: "Present",
        },
        status: "DRIFTED" as const,
        desiredState: { AllowAnonymousUsersToJoinMeeting: false, AutoAdmittedUsers: "EveryoneInCompanyExcludingGuests" },
        actualState: { AllowAnonymousUsersToJoinMeeting: true, AutoAdmittedUsers: "Everyone" },
        differingProperties: ["AllowAnonymousUsersToJoinMeeting", "AutoAdmittedUsers"],
      },
    ],
  },
  {
    workload: "TEAMS" as const,
    resourceType: "TeamsMessagingPolicy",
    resources: [
      {
        displayName: "Global Messaging Policy",
        primaryKey: "Global",
        properties: {
          Identity: "Global",
          AllowUrlPreviews: true,
          AllowOwnerDeleteMessage: true,
          AllowUserEditMessage: true,
          AllowUserDeleteMessage: true,
          AllowUserChat: true,
          AllowGiphy: true,
          GiphyRatingType: "Moderate",
          AllowMemes: true,
          AllowStickers: true,
          ReadReceiptsEnabledType: "UserPreference",
          Ensure: "Present",
        },
        status: "COMPLIANT" as const,
      },
    ],
  },
  {
    workload: "TEAMS" as const,
    resourceType: "TeamsGuestCallingConfiguration",
    resources: [
      {
        displayName: "Guest Calling Config",
        primaryKey: "Global",
        properties: {
          Identity: "Global",
          AllowPrivateCalling: false,
          Ensure: "Present",
        },
        status: "COMPLIANT" as const,
      },
    ],
  },

  // ─── Security & Compliance ────────────────────────────
  {
    workload: "SC" as const,
    resourceType: "SCDLPCompliancePolicy",
    resources: [
      {
        displayName: "PII Protection Policy",
        primaryKey: "PII Protection Policy",
        properties: {
          Name: "PII Protection Policy",
          ExchangeLocation: ["All"],
          SharePointLocation: ["All"],
          OneDriveLocation: ["All"],
          TeamsLocation: ["All"],
          Mode: "Enable",
          Ensure: "Present",
        },
        status: "COMPLIANT" as const,
      },
      {
        displayName: "Financial Data Protection",
        primaryKey: "Financial Data Protection",
        properties: {
          Name: "Financial Data Protection",
          ExchangeLocation: ["All"],
          SharePointLocation: ["All"],
          Mode: "Enable",
          Ensure: "Present",
        },
        status: "COMPLIANT" as const,
      },
    ],
  },
  {
    workload: "SC" as const,
    resourceType: "SCRetentionCompliancePolicy",
    resources: [
      {
        displayName: "7-Year Retention Policy",
        primaryKey: "7-Year Retention Policy",
        properties: {
          Name: "7-Year Retention Policy",
          ExchangeLocation: ["All"],
          SharePointLocation: ["All"],
          OneDriveLocation: ["All"],
          Enabled: true,
          Ensure: "Present",
        },
        status: "COMPLIANT" as const,
      },
    ],
  },
  {
    workload: "SC" as const,
    resourceType: "SCSensitivityLabel",
    resources: [
      {
        displayName: "Confidential",
        primaryKey: "Confidential",
        properties: {
          Name: "Confidential",
          DisplayName: "Confidential",
          Tooltip: "Business data that could cause damage if shared externally",
          Priority: 2,
          Disabled: false,
          ContentType: ["File", "Email", "Site", "UnifiedGroup"],
          Ensure: "Present",
        },
        status: "COMPLIANT" as const,
      },
      {
        displayName: "Highly Confidential",
        primaryKey: "Highly Confidential",
        properties: {
          Name: "Highly Confidential",
          DisplayName: "Highly Confidential",
          Tooltip: "Very sensitive business data - restricted access",
          Priority: 3,
          Disabled: false,
          EncryptionEnabled: true,
          ContentType: ["File", "Email"],
          Ensure: "Present",
        },
        status: "DRIFTED" as const,
        desiredState: { EncryptionEnabled: true, Disabled: false },
        actualState: { EncryptionEnabled: false, Disabled: false },
        differingProperties: ["EncryptionEnabled"],
      },
    ],
  },

  // ─── Intune ───────────────────────────────────────────
  {
    workload: "INTUNE" as const,
    resourceType: "IntuneDeviceCompliancePolicyWindows10",
    resources: [
      {
        displayName: "Windows 10 Compliance Policy",
        primaryKey: "Windows 10 Compliance Policy",
        properties: {
          DisplayName: "Windows 10 Compliance Policy",
          PasswordRequired: true,
          PasswordMinimumLength: 12,
          PasswordRequiredType: "Alphanumeric",
          OsMinimumVersion: "10.0.19045",
          BitLockerEnabled: true,
          SecureBootEnabled: true,
          CodeIntegrityEnabled: true,
          StorageRequireEncryption: true,
          FirewallEnabled: true,
          AntivirusRequired: true,
          Ensure: "Present",
        },
        status: "COMPLIANT" as const,
      },
    ],
  },
  {
    workload: "INTUNE" as const,
    resourceType: "IntuneDeviceConfigurationPolicyWindows10",
    resources: [
      {
        displayName: "Windows Security Baseline",
        primaryKey: "Windows Security Baseline",
        properties: {
          DisplayName: "Windows Security Baseline",
          DefenderCloudBlockLevel: "High",
          DefenderScanMaxCpu: 50,
          SmartScreenEnabled: true,
          SmartScreenBlockOverrideForFiles: true,
          PasswordMinimumLength: 12,
          PasswordBlockSimple: true,
          PasswordExpirationDays: 90,
          Ensure: "Present",
        },
        status: "DRIFTED" as const,
        desiredState: { PasswordExpirationDays: 90, DefenderCloudBlockLevel: "High" },
        actualState: { PasswordExpirationDays: 180, DefenderCloudBlockLevel: "NotConfigured" },
        differingProperties: ["PasswordExpirationDays", "DefenderCloudBlockLevel"],
      },
    ],
  },
  {
    workload: "INTUNE" as const,
    resourceType: "IntuneDeviceEnrollmentPlatformRestriction",
    resources: [
      {
        displayName: "Platform Enrollment Restrictions",
        primaryKey: "DefaultPlatformRestrictions",
        properties: {
          DisplayName: "Default Platform Restrictions",
          AndroidPlatformBlocked: false,
          AndroidPersonalDeviceEnrollmentBlocked: true,
          iOSPlatformBlocked: false,
          iOSPersonalDeviceEnrollmentBlocked: false,
          WindowsPlatformBlocked: false,
          MacPlatformBlocked: false,
          Ensure: "Present",
        },
        status: "COMPLIANT" as const,
      },
    ],
  },

  // ─── Defender ─────────────────────────────────────────
  {
    workload: "DEFENDER" as const,
    resourceType: "EXOAtpPolicyForO365",
    resources: [
      {
        displayName: "ATP Policy for Office 365",
        primaryKey: "Default",
        properties: {
          IsSingleInstance: "Yes",
          EnableATPForSPOTeamsODB: true,
          EnableSafeDocs: true,
          AllowSafeDocsOpen: false,
          Ensure: "Present",
        },
        status: "COMPLIANT" as const,
      },
    ],
  },

  // ─── OneDrive ─────────────────────────────────────────
  {
    workload: "OD" as const,
    resourceType: "ODSettings",
    resources: [
      {
        displayName: "OneDrive Settings",
        primaryKey: "ODSettings",
        properties: {
          IsSingleInstance: "Yes",
          OneDriveStorageQuota: 1048576,
          OrphanedPersonalSitesRetentionPeriod: 365,
          BlockMacSync: false,
          DisableReportProblemDialog: false,
          ExcludedFileExtensions: ["pst"],
          NotifyOwnersWhenInvitationsAccepted: true,
          Ensure: "Present",
        },
        status: "COMPLIANT" as const,
      },
    ],
  },
];
