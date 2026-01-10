// Export the plugin for external usage
export * from './audit.plugin';

// Make it the default export as well for easier consumption
import { AuditLogPlugin } from './audit.plugin';
export default AuditLogPlugin;
