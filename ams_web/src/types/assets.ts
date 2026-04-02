export interface Category {
  id: string;
  name: string;
  depreciation_rate?: number;
  salvage_rate?: number;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  department?: { id: string; name: string };
}

export interface Asset {
  id: string;
  name: string;
  tag_id: string;
  serial_number: string;
  description?: string;
  status: 'IN_STOCK' | 'ASSIGNED' | 'BROKEN' | 'MISSING' | 'DISPOSED';
  location: string;
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
}

export interface AssetRequest {
  id: string;
  title: string;
  description: string;
  quantity?: number;
  estimated_unit_cost?: number;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'HOD_APPROVED' | 'APPROVED' | 'REJECTED' | 'FULFILLED';
  requested_by?: { full_name: string; id: string };
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
  explanation: string;
  evidence_url?: string;
  investigation_status: 'INVESTIGATING' | 'ACCEPTED' | 'DENIED';
  investigation_remarks?: string;
  resolved_at?: string;
  reported_at: string;
}
