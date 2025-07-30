import { BaseModel } from './BaseModel';
import { AuditLog } from '@/types/audit';

export class AuditLogModel extends BaseModel<AuditLog> {
  protected tableName = 'activity_logs';
}
