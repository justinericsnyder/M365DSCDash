// Plain-language explanations for common M365/Purview/DSC drift properties
// Helps admins understand what changed, why it matters, and what to do

interface DriftExplanation {
  setting: string;
  description: string;
  risk: string;
  recommendation: string;
}

const explanations: Record<string, DriftExplanation> = {
  // ─── Conditional Access / AAD ─────────────────────────
  "State": {
    setting: "Policy Enforcement State",
    description: "Controls whether a Conditional Access policy is actively enforced, in report-only mode, or disabled.",
    risk: "A policy in report-only or disabled state is not protecting your organization. Users can bypass the intended security controls.",
    recommendation: "Set to 'enabled' to enforce the policy. Use report-only temporarily during testing only.",
  },
  "state": {
    setting: "Policy Enforcement State",
    description: "Controls whether a Conditional Access policy is actively enforced, in report-only mode, or disabled.",
    risk: "A policy in report-only or disabled state is not protecting your organization. Users can bypass the intended security controls.",
    recommendation: "Set to 'enabled' to enforce the policy. Use report-only temporarily during testing only.",
  },
  "EnableGroupCreation": {
    setting: "Self-Service Group Creation",
    description: "Controls whether regular users can create Microsoft 365 groups and Teams without admin approval.",
    risk: "When enabled, users can create unlimited groups/Teams, leading to sprawl, data exposure, and governance challenges.",
    recommendation: "Disable self-service group creation and restrict it to a security group of approved users.",
  },
  "BlockMsolPowerShell": {
    setting: "Legacy PowerShell Access",
    description: "Controls whether the legacy MSOL PowerShell module can connect to your tenant.",
    risk: "Legacy PowerShell modules don't support modern auth and can be exploited by attackers to bypass Conditional Access.",
    recommendation: "Block MSOL PowerShell access. Use Microsoft Graph PowerShell SDK instead.",
  },
  "AllowInvitesFrom": {
    setting: "Guest Invitation Policy",
    description: "Controls who in your organization can invite external guests.",
    risk: "If set to 'everyone', any user can invite external guests, potentially exposing sensitive data to unauthorized parties.",
    recommendation: "Restrict to 'adminsAndGuestInviters' or 'adminsGuestInvitersAndAllMembers' based on your security posture.",
  },
  "IsEnabled": {
    setting: "Feature Enabled/Disabled",
    description: "Controls whether a security feature or policy is active.",
    risk: "Disabling security features removes a layer of protection from your environment.",
    recommendation: "Keep security features enabled unless there's a documented business reason to disable them.",
  },
  "isEnabled": {
    setting: "Feature Enabled/Disabled",
    description: "Controls whether a security feature or policy is active.",
    risk: "Disabling security features removes a layer of protection from your environment.",
    recommendation: "Keep security features enabled unless there's a documented business reason to disable them.",
  },

  // ─── SharePoint / OneDrive ────────────────────────────
  "SharingCapability": {
    setting: "External Sharing Level",
    description: "Controls how broadly SharePoint and OneDrive content can be shared with people outside your organization.",
    risk: "Overly permissive sharing (e.g., 'ExternalUserAndGuestSharing') allows anyone with a link to access your files, including anonymous users.",
    recommendation: "Set to 'ExternalUserSharingOnly' or 'Disabled' to require authentication for external access.",
  },
  "PreventExternalUsersFromResharing": {
    setting: "External Resharing Prevention",
    description: "Controls whether external users who receive shared content can reshare it with others.",
    risk: "When disabled, external users can forward your shared content to anyone, creating an uncontrolled chain of access.",
    recommendation: "Enable this setting to prevent external users from resharing your organization's content.",
  },
  "IsResharingByExternalUsersEnabled": {
    setting: "External Resharing",
    description: "Controls whether external users can reshare content they've been given access to.",
    risk: "Allowing resharing means your content can spread beyond the people you originally shared it with.",
    recommendation: "Disable external resharing to maintain control over who can access your content.",
  },

  // ─── Teams ────────────────────────────────────────────
  "AllowAnonymousUsersToJoinMeeting": {
    setting: "Anonymous Meeting Join",
    description: "Controls whether people without a Microsoft account can join Teams meetings.",
    risk: "Anonymous users can join meetings without identity verification, potentially eavesdropping on sensitive discussions.",
    recommendation: "Disable anonymous join for sensitive meetings. Use lobby controls to screen attendees.",
  },
  "AutoAdmittedUsers": {
    setting: "Meeting Auto-Admit Policy",
    description: "Controls who is automatically admitted to Teams meetings without waiting in the lobby.",
    risk: "Setting to 'Everyone' bypasses the lobby for all participants including external and anonymous users.",
    recommendation: "Set to 'EveryoneInCompanyExcludingGuests' to require lobby approval for external participants.",
  },
  "AllowCloudRecording": {
    setting: "Meeting Cloud Recording",
    description: "Controls whether Teams meetings can be recorded and stored in the cloud.",
    risk: "Recordings may contain sensitive information. Without proper controls, recordings could be accessed by unauthorized users.",
    recommendation: "Enable with appropriate retention and access policies. Ensure recordings are stored in compliant locations.",
  },

  // ─── Exchange Online ──────────────────────────────────
  "EnableInternalSenderAdminNotifications": {
    setting: "Malware Admin Notifications",
    description: "Controls whether admins receive email notifications when malware is detected in internal messages.",
    risk: "Without notifications, malware incidents may go undetected, allowing threats to spread within your organization.",
    recommendation: "Enable admin notifications and set a monitored security mailbox as the recipient.",
  },
  "InternalSenderAdminAddress": {
    setting: "Security Notification Email",
    description: "The email address that receives security alerts for malware and policy violations.",
    risk: "An empty or incorrect address means critical security alerts are not being delivered to your security team.",
    recommendation: "Set to your security operations team's monitored mailbox (e.g., secops@company.com).",
  },

  // ─── Purview / Sensitivity Labels ─────────────────────
  "hasProtection": {
    setting: "Label Encryption Protection",
    description: "Controls whether a sensitivity label applies encryption to protect content.",
    risk: "Without encryption, labeled content can be read by anyone who gains access to the file, even if it's marked as confidential.",
    recommendation: "Enable encryption on Confidential and Highly Confidential labels to protect content at rest and in transit.",
  },
  "isEndpointProtectionEnabled": {
    setting: "Endpoint DLP Protection",
    description: "Controls whether endpoint Data Loss Prevention policies are enforced for content with this label.",
    risk: "Without endpoint DLP, users can copy, print, or transfer labeled content to unauthorized locations from their devices.",
    recommendation: "Enable endpoint protection for sensitive labels to prevent data exfiltration via copy, print, USB, and network share.",
  },
  "priority": {
    setting: "Label Priority Order",
    description: "Determines the precedence of sensitivity labels. Lower numbers = higher priority.",
    risk: "Incorrect priority ordering can cause the wrong label to be applied when auto-labeling or when labels conflict.",
    recommendation: "Ensure labels are ordered from least sensitive (highest number) to most sensitive (lowest number).",
  },
  "applicableTo": {
    setting: "Label Scope",
    description: "Controls which content types (email, files, sites, Teams) a sensitivity label can be applied to.",
    risk: "Expanding scope without review may apply protection to content types that weren't intended, or miss content that should be protected.",
    recommendation: "Review scope changes carefully. Ensure labels cover all content types that contain the sensitivity level they represent.",
  },
  "EncryptionEnabled": {
    setting: "Label Encryption",
    description: "Controls whether content with this label is encrypted.",
    risk: "Disabling encryption on a sensitive label means the content is no longer protected even though users believe it is.",
    recommendation: "Keep encryption enabled on all Confidential and Highly Confidential labels.",
  },
  "applicationMode": {
    setting: "Label Application Mode",
    description: "Controls whether a label is applied manually by users, recommended by the system, or applied automatically.",
    risk: "Changing from manual to automatic may apply labels to content that wasn't intended. Changing from automatic to manual may leave content unprotected.",
    recommendation: "Test automatic labeling in simulation mode before enabling. Ensure auto-labeling rules are accurate.",
  },
  "color": {
    setting: "Label Display Color",
    description: "The visual color shown to users when a sensitivity label is applied.",
    risk: "Color changes can confuse users about the sensitivity level of content they're working with.",
    recommendation: "Use consistent colors across your label taxonomy. Red for highly confidential, yellow for confidential, blue for general.",
  },

  // ─── Intune ───────────────────────────────────────────
  "PasswordExpirationDays": {
    setting: "Password Expiration Policy",
    description: "The number of days before a device password must be changed.",
    risk: "Longer expiration periods mean compromised passwords remain valid for longer. Shorter periods cause user friction.",
    recommendation: "NIST recommends against forced password rotation. Use 90-180 days if required by compliance, or disable with strong MFA.",
  },
  "DefenderCloudBlockLevel": {
    setting: "Defender Cloud Protection Level",
    description: "Controls how aggressively Microsoft Defender blocks suspicious files using cloud intelligence.",
    risk: "Setting to 'NotConfigured' or 'Low' reduces protection against zero-day threats and new malware variants.",
    recommendation: "Set to 'High' or 'HighPlus' for maximum protection. Monitor for false positives.",
  },

  // ─── Security Defaults ────────────────────────────────
  "CurrentScore": {
    setting: "Microsoft Secure Score",
    description: "Your organization's security posture score based on Microsoft's security recommendations.",
    risk: "A low score indicates unaddressed security recommendations that could leave your organization vulnerable.",
    recommendation: "Review and implement the recommended security controls in the Microsoft 365 Security Center.",
  },

  // ─── Generic fallbacks ────────────────────────────────
  "_exist": {
    setting: "Resource Existence",
    description: "Whether a required service, process, or configuration item exists on the system.",
    risk: "A missing resource means a required component is not running or installed, which could affect service availability or security.",
    recommendation: "Ensure the resource is installed and running. Check service status and restart if necessary.",
  },
  "valueName": {
    setting: "Registry Value",
    description: "A Windows registry value that controls system or application behavior.",
    risk: "Incorrect registry values can disable security features, change application behavior, or create vulnerabilities.",
    recommendation: "Restore the registry value to the desired state defined in your DSC configuration.",
  },
  "valueData": {
    setting: "Registry Value Data",
    description: "The data stored in a Windows registry value.",
    risk: "Changed registry data can alter security settings, disable protections, or modify application configurations.",
    recommendation: "Compare the current value with the desired state and remediate using DSC set operation.",
  },
};

export function getExplanation(property: string): DriftExplanation | null {
  return explanations[property] || null;
}

export function getExplanationForDrift(properties: string[]): DriftExplanation[] {
  const results: DriftExplanation[] = [];
  for (const prop of properties) {
    const exp = explanations[prop];
    if (exp) results.push(exp);
  }
  return results;
}

// Generate a generic explanation for unknown properties
export function getGenericExplanation(property: string): DriftExplanation {
  return {
    setting: property.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim(),
    description: `The '${property}' setting has changed from its desired configuration.`,
    risk: "Configuration drift means your environment no longer matches the approved baseline, which could introduce security gaps or compliance violations.",
    recommendation: `Review the '${property}' setting and determine if the change was intentional. If not, remediate to match the desired state.`,
  };
}
