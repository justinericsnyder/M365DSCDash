// Plain-language explanations sourced from official Microsoft documentation
// Each entry includes a docUrl linking to the authoritative Microsoft Learn page

interface DriftExplanation {
  setting: string;
  description: string;
  risk: string;
  recommendation: string;
  docUrl?: string;
}

const explanations: Record<string, DriftExplanation> = {
  // ─── Conditional Access / Entra ID ────────────────────
  // Source: https://learn.microsoft.com/en-us/entra/identity/conditional-access/concept-conditional-access-report-only
  "State": {
    setting: "Conditional Access Policy State",
    description: "Conditional Access policies have three states: On, Off, and Report-only. Report-only mode allows administrators to evaluate the impact of policies before enabling them. Policies in report-only are evaluated during sign-in but not enforced.",
    risk: "A policy in report-only or disabled state is not enforcing its security controls. Sign-ins that should be blocked or require MFA will be allowed through without restriction.",
    recommendation: "Move policies from report-only to 'On' after validating impact via sign-in logs. Keep break-glass accounts excluded.",
    docUrl: "https://learn.microsoft.com/en-us/entra/identity/conditional-access/concept-conditional-access-report-only",
  },
  "state": {
    setting: "Conditional Access Policy State",
    description: "Conditional Access policies have three states: On, Off, and Report-only. Report-only mode allows administrators to evaluate the impact of policies before enabling them. Policies in report-only are evaluated during sign-in but not enforced.",
    risk: "A policy in report-only or disabled state is not enforcing its security controls. Sign-ins that should be blocked or require MFA will be allowed through without restriction.",
    recommendation: "Move policies from report-only to 'On' after validating impact via sign-in logs. Keep break-glass accounts excluded.",
    docUrl: "https://learn.microsoft.com/en-us/entra/identity/conditional-access/concept-conditional-access-report-only",
  },
  // Source: https://learn.microsoft.com/en-us/entra/fundamentals/concept-group-based-licensing
  "EnableGroupCreation": {
    setting: "Self-Service Group Creation",
    description: "Controls whether users can create Microsoft 365 groups (which also creates Teams, SharePoint sites, and Planner plans). When enabled, any user can create groups without admin approval.",
    risk: "Unrestricted group creation leads to sprawl — hundreds of unused groups, duplicate Teams, and unmanaged SharePoint sites with potentially sensitive data.",
    recommendation: "Restrict group creation to a designated security group. Configure naming policies and expiration policies for governance.",
    docUrl: "https://learn.microsoft.com/en-us/entra/identity/users/groups-self-service-management",
  },
  // Source: https://learn.microsoft.com/en-us/entra/identity/users/users-restrict-guest-permissions
  "AllowInvitesFrom": {
    setting: "Guest Invitation Settings",
    description: "Controls who in your organization can invite guest users to your Microsoft Entra tenant. Options range from 'everyone' (any user can invite) to 'none' (only admins).",
    risk: "If set to 'everyone', any employee can invite external guests who then gain access to Teams, SharePoint, and other resources based on your sharing policies.",
    recommendation: "Set to 'adminsAndGuestInviters' to limit invitations to admins and users in the Guest Inviter role.",
    docUrl: "https://learn.microsoft.com/en-us/entra/identity/users/users-restrict-guest-permissions",
  },
  // Source: https://learn.microsoft.com/en-us/powershell/module/microsoft.graph.identity.signins/update-mgpolicyauthorizationpolicy
  "BlockMsolPowerShell": {
    setting: "Block Legacy MSOL PowerShell",
    description: "Controls whether the legacy MSOnline (MSOL) PowerShell module can authenticate to your tenant. The MSOL module uses legacy authentication that bypasses Conditional Access policies.",
    risk: "Attackers can use MSOL PowerShell to authenticate with stolen credentials while bypassing MFA and Conditional Access policies that protect interactive sign-ins.",
    recommendation: "Set to true to block MSOL PowerShell. Migrate scripts to Microsoft Graph PowerShell SDK which supports modern authentication.",
    docUrl: "https://learn.microsoft.com/en-us/entra/identity/users/users-default-permissions",
  },

  // ─── SharePoint / OneDrive ────────────────────────────
  // Source: https://learn.microsoft.com/en-us/sharepoint/turn-external-sharing-on-or-off
  "SharingCapability": {
    setting: "SharePoint External Sharing Level",
    description: "Controls the organization-level external sharing setting for SharePoint and OneDrive. Levels from most to least permissive: Anyone (anonymous links), New and existing guests, Existing guests only, Only people in your organization.",
    risk: "'ExternalUserAndGuestSharing' (Anyone) allows anonymous access links — anyone with the link can access files without authentication. This is the most common cause of accidental data exposure.",
    recommendation: "Set to 'ExternalUserSharingOnly' (New and existing guests) which requires authentication. Use 'Disabled' for highly sensitive tenants.",
    docUrl: "https://learn.microsoft.com/en-us/sharepoint/turn-external-sharing-on-or-off",
  },
  // Source: https://learn.microsoft.com/en-us/sharepoint/turn-external-sharing-on-or-off
  "PreventExternalUsersFromResharing": {
    setting: "Prevent External Resharing",
    description: "When enabled, external users who receive shared content cannot reshare it with additional people. This prevents a chain of sharing beyond your original intent.",
    risk: "Without this control, an external user you share a document with can forward that sharing link to anyone else, creating uncontrolled access to your organization's content.",
    recommendation: "Enable this setting to maintain control over who can access externally shared content.",
    docUrl: "https://learn.microsoft.com/en-us/sharepoint/turn-external-sharing-on-or-off",
  },
  "IsResharingByExternalUsersEnabled": {
    setting: "External User Resharing",
    description: "Controls whether external users can reshare content they have been given access to in SharePoint and OneDrive.",
    risk: "Allowing resharing means your content can spread beyond the people you originally shared it with, without your knowledge or consent.",
    recommendation: "Set to false to prevent external users from resharing your organization's content.",
    docUrl: "https://learn.microsoft.com/en-us/sharepoint/turn-external-sharing-on-or-off",
  },

  // ─── Teams ────────────────────────────────────────────
  // Source: https://learn.microsoft.com/en-us/microsoftteams/anonymous-users-in-meetings
  "AllowAnonymousUsersToJoinMeeting": {
    setting: "Anonymous Meeting Participants",
    description: "Controls whether people who aren't logged into a Microsoft account can join Teams meetings. Anonymous users join without identity verification and appear as 'Guest' in the participant list.",
    risk: "Anonymous participants cannot be identified or audited. They could eavesdrop on sensitive discussions, capture shared screens, or disrupt meetings.",
    recommendation: "Disable for sensitive meetings. Use the lobby to screen anonymous participants when enabled. Consider Teams Premium for one-time passcode verification.",
    docUrl: "https://learn.microsoft.com/en-us/microsoftteams/anonymous-users-in-meetings",
  },
  // Source: https://learn.microsoft.com/en-us/microsoftteams/configure-lobby-sensitive-meetings
  "AutoAdmittedUsers": {
    setting: "Meeting Lobby Bypass",
    description: "Controls who is automatically admitted to Teams meetings without waiting in the lobby. Options: Everyone, EveryoneInCompany, EveryoneInCompanyExcludingGuests, EveryoneInSameAndFederatedCompany, OrganizerOnly, InvitedUsers.",
    risk: "Setting to 'Everyone' bypasses the lobby for all participants including anonymous and external users, removing a key screening control for meeting access.",
    recommendation: "Set to 'EveryoneInCompanyExcludingGuests' for standard meetings. Use 'OrganizerOnly' or 'InvitedUsers' for sensitive meetings.",
    docUrl: "https://learn.microsoft.com/en-us/microsoftteams/configure-lobby-sensitive-meetings",
  },

  // ─── Exchange Online ──────────────────────────────────
  // Source: https://learn.microsoft.com/en-us/defender-office-365/anti-malware-policies-configure
  "EnableInternalSenderAdminNotifications": {
    setting: "Malware Detection Admin Alerts",
    description: "When enabled, the anti-malware policy sends email notifications to a designated admin address whenever malware is detected in messages from internal senders.",
    risk: "Without admin notifications, malware incidents from compromised internal accounts may go undetected, allowing threats to spread within your organization before anyone notices.",
    recommendation: "Enable and configure a monitored security operations mailbox as the notification recipient.",
    docUrl: "https://learn.microsoft.com/en-us/defender-office-365/anti-malware-policies-configure",
  },
  "InternalSenderAdminAddress": {
    setting: "Malware Alert Recipient",
    description: "The email address that receives admin notifications when the anti-malware policy detects malware from internal senders.",
    risk: "An empty or incorrect address means critical malware alerts are not being delivered to your security team, delaying incident response.",
    recommendation: "Set to your security operations team's monitored mailbox (e.g., secops@yourcompany.com).",
    docUrl: "https://learn.microsoft.com/en-us/defender-office-365/anti-malware-policies-configure",
  },

  // ─── Purview Sensitivity Labels ───────────────────────
  // Source: https://learn.microsoft.com/en-us/purview/encryption-sensitivity-labels
  "hasProtection": {
    setting: "Sensitivity Label Encryption",
    description: "When a sensitivity label has protection (encryption) enabled, it applies Azure Rights Management encryption to content. This ensures only authorized users can access the content, regardless of where it's stored or shared.",
    risk: "Without encryption, labeled content can be read by anyone who gains access to the file — the label becomes a visual marker only, with no actual data protection.",
    recommendation: "Enable encryption on Confidential and Highly Confidential labels. Configure usage rights to control who can view, edit, print, and forward protected content.",
    docUrl: "https://learn.microsoft.com/en-us/purview/encryption-sensitivity-labels",
  },
  // Source: https://learn.microsoft.com/en-us/purview/dlp-configure-endpoint-settings
  "isEndpointProtectionEnabled": {
    setting: "Endpoint DLP for Sensitivity Label",
    description: "When enabled, Microsoft Purview endpoint Data Loss Prevention (DLP) enforces policies on devices for content with this label. This controls actions like copy to clipboard, print, upload to cloud, and transfer via USB or network share.",
    risk: "Without endpoint DLP, users can freely copy, print, or transfer labeled sensitive content to unauthorized locations from their devices, even if the content is encrypted.",
    recommendation: "Enable endpoint protection for Confidential and Highly Confidential labels. Configure DLP policies to audit or block sensitive actions on endpoints.",
    docUrl: "https://learn.microsoft.com/en-us/purview/dlp-configure-endpoint-settings",
  },
  // Source: https://learn.microsoft.com/en-us/purview/sensitivity-labels
  "priority": {
    setting: "Sensitivity Label Priority",
    description: "Label priority determines precedence when multiple labels could apply. Labels are ordered in the Microsoft Purview portal from least sensitive (lowest priority number) to most sensitive (highest priority number). The most restrictive label wins.",
    risk: "Incorrect priority ordering can cause auto-labeling to apply the wrong sensitivity level, or prevent users from upgrading to a more restrictive label when needed.",
    recommendation: "Order labels from least to most sensitive: Public (0) → General (1) → Confidential (4) → Highly Confidential (8). Ensure sublabel priorities fall within their parent's range.",
    docUrl: "https://learn.microsoft.com/en-us/purview/sensitivity-labels",
  },
  // Source: https://learn.microsoft.com/en-us/purview/sensitivity-labels
  "applicableTo": {
    setting: "Sensitivity Label Scope",
    description: "Defines which content types a sensitivity label can be applied to: files, emails, meetings, sites, Teams, Microsoft 365 Groups, and schematized data assets in Microsoft Purview Data Map.",
    risk: "Expanding scope without review may apply protection to content types that weren't planned for, or removing scope may leave content types unprotected that should be covered.",
    recommendation: "Review scope changes against your information protection policy. Ensure all content types containing data at this sensitivity level are covered.",
    docUrl: "https://learn.microsoft.com/en-us/purview/sensitivity-labels",
  },
  "applicationMode": {
    setting: "Label Application Mode",
    description: "Controls how a sensitivity label is applied: manually by users, recommended by the system (users see a suggestion but can dismiss), or automatically applied without user action.",
    risk: "Switching from manual to automatic may label content users didn't intend to protect, causing access issues. Switching from automatic to manual may leave sensitive content unlabeled.",
    recommendation: "Test automatic labeling in simulation mode before enabling. Use recommended mode as an intermediate step. Monitor auto-labeling accuracy via activity explorer.",
    docUrl: "https://learn.microsoft.com/en-us/purview/apply-sensitivity-label-automatically",
  },
  "EncryptionEnabled": {
    setting: "Label Encryption Toggle",
    description: "Controls whether content with this sensitivity label is encrypted using Azure Rights Management. Encryption persists with the content regardless of where it's stored.",
    risk: "Disabling encryption on a label that users believe provides protection creates a false sense of security — content is classified but not actually protected.",
    recommendation: "Keep encryption enabled on all Confidential and Highly Confidential labels. If encryption must be removed, communicate the change to affected users.",
    docUrl: "https://learn.microsoft.com/en-us/purview/encryption-sensitivity-labels",
  },
  "color": {
    setting: "Sensitivity Label Color",
    description: "The visual color displayed to users in Office apps and other Microsoft 365 services when a sensitivity label is applied. Colors help users quickly identify the sensitivity level.",
    risk: "Inconsistent colors can confuse users about the sensitivity level of content they're working with, leading to mishandling of sensitive information.",
    recommendation: "Use a consistent color scheme: green for Public, blue for General, yellow/orange for Confidential, red for Highly Confidential.",
    docUrl: "https://learn.microsoft.com/en-us/purview/sensitivity-labels-office-apps",
  },

  // ─── Intune ───────────────────────────────────────────
  // Source: https://learn.microsoft.com/en-us/mem/intune/protect/device-compliance-get-started
  "PasswordExpirationDays": {
    setting: "Device Password Expiration",
    description: "The maximum number of days before a device password must be changed. This is configured in Intune device compliance or configuration policies.",
    risk: "NIST SP 800-63B recommends against periodic password changes as they lead to weaker passwords. However, some compliance frameworks still require rotation.",
    recommendation: "If your compliance framework requires rotation, set to 90-180 days. Otherwise, disable forced rotation and enforce strong passwords with MFA.",
    docUrl: "https://learn.microsoft.com/en-us/mem/intune/protect/device-compliance-get-started",
  },
  // Source: https://learn.microsoft.com/en-us/defender-endpoint/configure-cloud-block-timeout-period-microsoft-defender-antivirus
  "DefenderCloudBlockLevel": {
    setting: "Defender Cloud Protection Level",
    description: "Controls how aggressively Microsoft Defender uses cloud-based intelligence to block suspicious files. Levels: Default, Moderate, High, High+, Zero Tolerance.",
    risk: "'NotConfigured' or 'Default' provides basic protection. Higher levels catch more zero-day threats but may increase false positives.",
    recommendation: "Set to 'High' for enterprise environments. Use 'High+' or 'Zero Tolerance' for high-security environments. Monitor for false positives.",
    docUrl: "https://learn.microsoft.com/en-us/defender-endpoint/specify-cloud-protection-level-microsoft-defender-antivirus",
  },

  // ─── Security Defaults / Secure Score ─────────────────
  // Source: https://learn.microsoft.com/en-us/entra/fundamentals/security-defaults
  "IsEnabled": {
    setting: "Security Feature Toggle",
    description: "Controls whether a security feature or policy is active in your tenant. For Security Defaults, this enables a baseline set of identity security mechanisms including MFA registration, blocking legacy auth, and protecting privileged actions.",
    risk: "Disabling security features removes protection layers. For Security Defaults specifically, disabling removes baseline MFA and legacy auth blocking for all users.",
    recommendation: "Keep security features enabled. If disabling Security Defaults, ensure equivalent or stronger Conditional Access policies are in place.",
    docUrl: "https://learn.microsoft.com/en-us/entra/fundamentals/security-defaults",
  },
  "isEnabled": {
    setting: "Security Feature Toggle",
    description: "Controls whether a security feature or policy is active in your tenant.",
    risk: "Disabling security features removes protection layers from your environment.",
    recommendation: "Keep security features enabled unless equivalent or stronger controls are in place.",
    docUrl: "https://learn.microsoft.com/en-us/entra/fundamentals/security-defaults",
  },

  // ─── Auth Methods ──────────────────────────────────────
  "AuthMethodState": {
    setting: "Authentication Method State",
    description: "Controls whether a specific authentication method (e.g., Microsoft Authenticator, FIDO2 keys, SMS) is enabled for users in your tenant.",
    risk: "Disabled authentication methods reduce MFA options, potentially forcing users to less secure methods or preventing sign-in.",
    recommendation: "Enable Microsoft Authenticator and FIDO2 security keys. Disable SMS and voice call methods where possible as they are vulnerable to SIM-swapping.",
    docUrl: "https://learn.microsoft.com/en-us/entra/identity/authentication/concept-authentication-methods",
  },
  "IsVerified": {
    setting: "Domain Verification Status",
    description: "Indicates whether a custom domain has been verified by proving ownership through DNS records.",
    risk: "Unverified domains cannot be used for user accounts or email routing and may indicate incomplete setup.",
    recommendation: "Complete domain verification by adding the required TXT or MX record to your DNS.",
    docUrl: "https://learn.microsoft.com/en-us/entra/fundamentals/add-custom-domain",
  },
  "IsArchived": {
    setting: "Team Archived Status",
    description: "An archived team is read-only — members can view content but cannot post messages, add files, or modify channels.",
    risk: "If a team is unexpectedly archived, active collaboration is disrupted for all members.",
    recommendation: "Review archived teams periodically. Unarchive if still needed for active work.",
    docUrl: "https://learn.microsoft.com/en-us/microsoftteams/archive-or-delete-a-team",
  },
  "QuotaState": {
    setting: "OneDrive Storage Quota State",
    description: "Indicates the current state of a user's OneDrive storage: normal, nearing, critical, or exceeded.",
    risk: "Users with exceeded quotas cannot upload new files, which may cause data loss from Office apps that auto-save to OneDrive.",
    recommendation: "Monitor quota states. Increase storage limits or help users clean up old files.",
    docUrl: "https://learn.microsoft.com/en-us/sharepoint/manage-site-collection-storage-limits",
  },
  "CurrentScore": {
    setting: "Microsoft Secure Score",
    description: "A numerical summary of your organization's security posture based on configurations and behaviors across Microsoft 365 services.",
    risk: "A score below 70% of maximum indicates significant unaddressed security recommendations — each is a potential attack vector.",
    recommendation: "Review improvement actions in Microsoft 365 Defender portal. Prioritize high-impact, low-effort actions first.",
    docUrl: "https://learn.microsoft.com/en-us/defender-xdr/microsoft-secure-score",
  },
  "EnvironmentState": {
    setting: "Power Platform Environment State",
    description: "The operational state of a Power Platform environment. Healthy environments show 'Ready'.",
    risk: "A non-ready environment means Power Apps, Power Automate flows, and Dataverse databases are unavailable.",
    recommendation: "Check the Power Platform admin center for environment health details.",
    docUrl: "https://learn.microsoft.com/en-us/power-platform/admin/environments-overview",
  },
  "CapacityState": {
    setting: "Fabric Capacity State",
    description: "The operational state of a Microsoft Fabric capacity. Active capacities are running and available.",
    risk: "A non-active capacity means all Fabric workspaces assigned to it are unavailable to users.",
    recommendation: "Resume paused capacities if needed. Review utilization to right-size your deployment.",
    docUrl: "https://learn.microsoft.com/en-us/fabric/enterprise/pause-resume",
  },

  // ─── DSC Infrastructure ───────────────────────────────
  // Source: https://learn.microsoft.com/en-us/powershell/dsc/concepts/resources/overview
  "_exist": {
    setting: "Resource Existence Check",
    description: "The DSC canonical property '_exist' indicates whether a managed resource (service, file, registry key) should exist on the system. DSC uses this to determine if a resource needs to be created or deleted.",
    risk: "A missing required resource means a critical service, configuration, or security control is not present on the system.",
    recommendation: "Run 'dsc config set' to enforce the desired state and create the missing resource. Investigate why it was removed.",
    docUrl: "https://learn.microsoft.com/en-us/powershell/dsc/concepts/resources/overview",
  },
  "valueName": {
    setting: "Windows Registry Value Name",
    description: "The name of a Windows registry value managed by the Microsoft.Windows/Registry DSC resource. Registry values control system and application behavior.",
    risk: "A changed or missing registry value can disable security features (like TLS enforcement), alter firewall rules, or modify application configurations.",
    recommendation: "Use 'dsc resource set' with the Microsoft.Windows/Registry resource to restore the value to its desired state.",
    docUrl: "https://learn.microsoft.com/en-us/powershell/dsc/reference/schemas/resource/manifest/root",
  },
  "valueData": {
    setting: "Windows Registry Value Data",
    description: "The data stored in a Windows registry value. DSC manages registry data types including String, DWord, QWord, Binary, MultiString, and ExpandString.",
    risk: "Incorrect registry data can weaken security settings (e.g., changing a DWord from 1 to 0 to disable a security feature) or break application functionality.",
    recommendation: "Compare the current value with the desired state in your DSC configuration document. Run 'dsc config set' to remediate.",
    docUrl: "https://learn.microsoft.com/en-us/powershell/dsc/reference/schemas/resource/manifest/root",
  },
};

export function getExplanation(property: string): DriftExplanation | null {
  return explanations[property] || null;
}

export function getExplanationForDrift(properties: string[]): DriftExplanation[] {
  return properties.map((p) => explanations[p]).filter(Boolean);
}

export function getGenericExplanation(property: string): DriftExplanation {
  return {
    setting: property.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim(),
    description: `The '${property}' setting has drifted from its desired configuration. This setting is part of your organization's approved baseline.`,
    risk: "Configuration drift means your environment no longer matches the approved baseline. This could introduce security gaps, compliance violations, or operational issues.",
    recommendation: `Review the '${property}' setting and determine if the change was intentional. If not, remediate to match the desired state. Check the Microsoft 365 admin center or relevant admin portal for this setting.`,
    docUrl: "https://learn.microsoft.com/en-us/microsoft-365/admin/",
  };
}
