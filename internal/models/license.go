package models

// License — лицензия на ПО, привязанная к пользователю
type License struct {
	ID             string `json:"id"`
	SoftwareName   string `json:"softwareName"`
	LicenseKey     string `json:"licenseKey"`
	LicenseType    string `json:"licenseType"` // "perpetual" | "subscription"
	UserID         string `json:"userId"`
	PurchaseDate   string `json:"purchaseDate,omitempty"`
	ExpirationDate string `json:"expirationDate,omitempty"`
	Quantity       int    `json:"quantity"`
	Notes          string `json:"notes,omitempty"`
}
