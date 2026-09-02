package tenanttest

import "testing"

func TestContainsTenantID(t *testing.T) {
	if !containsTenantID(`SELECT * FROM devices WHERE tenant_id = $1`) {
		t.Fatal("expected tenant_id to be detected")
	}
	if containsTenantID(`SELECT * FROM devices WHERE id = $1`) {
		t.Fatal("did not expect tenant_id in query without it")
	}
}
