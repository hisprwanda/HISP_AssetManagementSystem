export interface RequestableItem {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  depreciation_rate?: number;
  disposal_rate?: number;
  requestable_items?: RequestableItem[];
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  job_title?: string;
  phone_number?: string;
  department?: { id: string; name: string };
}

export interface AssetAssignment {
  id: string;
  user: User;
  asset: Asset;
  assigned_at: string;
  returned_at?: string;
  condition_on_assign?: string;
  form_status:
    | 'DRAFT'
    | 'PENDING_USER_SIGNATURE'
    | 'PENDING_ADMIN_REVIEW'
    | 'APPROVED'
    | 'REJECTED';
  form_number?: string;
  admin_signature_name?: string;
  admin_signed_at?: string;
  user_signature_name?: string;
  user_signed_at?: string;
  received_from_name?: string;
  received_at?: string;
  rejection_reason?: string;
  scanned_form_url?: string;
}

export interface POData {
  vendor_details: string;
  order_date: string;
  po_number: string;
  payment_terms: string;
  special_instructions: string;
  period_of_performance: string;
  shipping_cost: number;
  other_cost: number;
  grand_total: number;
  hisp_sign_name: string;
  hisp_sign_date: string;
  vendor_sign_name: string;
  vendor_sign_date: string;
  authorized_by: string;
}

export interface Asset {
  id: string;
  name: string;
  tag_id: string | null;
  serial_number: string | null;
  description: string | null;
  status:
    | 'IN_STOCK'
    | 'ASSIGNED'
    | 'BROKEN'
    | 'MISSING'
    | 'DISPOSED'
    | 'RETURN_PENDING';
  location: string | null;
  category?: { id: string; name: string };
  department?: { id: string; name: string };
  assigned_to?: { id: string; full_name: string };
  purchase_cost?: number;
  purchase_date?: string;
  warranty_expiry?: string;
  current_value?: number;
  accumulated_depreciation?: number;
  disposal_value?: number;
  disposal_date?: string;
  disposal_reason?: string;
  assignment_history?: AssetAssignment[];
  is_shared?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AssetRequest {
  id: string;
  title: string;
  description: string;
  batch_number?: string;
  quantity?: number;
  estimated_unit_cost?: number;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status:
    | 'PENDING'
    | 'PENDING_FORMALIZATION'
    | 'HOD_APPROVED'
    | 'APPROVED'
    | 'CEO_REVIEW'
    | 'CEO_APPROVED'
    | 'ORDERED'
    | 'REJECTED'
    | 'FULFILLED';
  ceo_remarks?: string;
  purchase_order?: POData;
  requested_by?: User;
  verified_by_finance?: User;
  department?: { id: string; name: string };
  items?: {
    name: string;
    description: string;
    quantity: number;
    unit_price: number;
  }[];
  financials?: {
    subtotal: number;
    transport_fees: number;
    grand_total: number;
    cost_basis?: string;
    budget_code_1?: string;
    budget_code_2?: string;
  };
  logistics?: {
    destination: string;
    contact_name: string;
    contact_email?: string;
    contact_phone: string;
  };
  created_at: string;
}

export interface AssetIncident {
  id: string;
  asset: Asset;
  reported_by: User;
  incident_type: 'BROKEN' | 'MISSING';
  location: string;
  issue_description: string;
  explanation?: string; // Legacy support
  evidence_url?: string;
  status:
    | 'PENDING'
    | 'IN_REPAIR'
    | 'RESOLVED_FIXED'
    | 'RESOLVED_REPLACED'
    | 'REJECTED_LIABILITY';
  investigation_status?: string; // Legacy support
  resolution_notes?: string;
  investigation_remarks?: string; // Legacy support
  penalty_amount?: number;
  penalty_resolved_at?: string | null;
  reported_at: string;
}
