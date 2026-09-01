package controller

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"math"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
	. "server/app/helpers"
	"server/app/model"
	"server/connection"
)

// Helper format number to Indonesian Rupiah currency format
func formatRupiah(n float64) string {
	in := fmt.Sprintf("%.0f", n)
	if len(in) == 0 {
		return "Rp 0"
	}
	out := make([]byte, len(in)+(len(in)-1)/3)
	for i, j, k := len(in)-1, len(out)-1, 0; i >= 0; i, j, k = i-1, j-1, k+1 {
		if k > 0 && k%3 == 0 {
			out[j] = '.'
			j--
		}
		out[j] = in[i]
	}
	return "Rp " + string(out)
}

// generate unique invoice code
func generateInvoiceCode() string {
	dateStr := time.Now().Format("20060102")
	bytes := make([]byte, 3) // 6 hex characters
	if _, err := rand.Read(bytes); err != nil {
		panic(err)
	}
	return fmt.Sprintf("INV/%s/%s", dateStr, strings.ToUpper(hex.EncodeToString(bytes)))
}

// Checkout godoc
// @Summary      Process Checkout
// @Description  Create transactions for packages in cart, handle vouchers and zero payment automatically
// @Tags         Checkout
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/checkout [post]
func Checkout(c echo.Context) error {
	type CheckoutRequest struct {
		UserID       uint     `json:"user_id"`
		PackageSlug  string   `json:"package_slug"`  // optional single
		PackageSlugs []string `json:"package_slugs"` // optional multiple
		VoucherCode  string   `json:"voucher_code"`  // optional
	}

	req := new(CheckoutRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Format data tidak valid"})
	}

	var allSlugs []string
	if req.PackageSlug != "" {
		allSlugs = append(allSlugs, req.PackageSlug)
	}
	if len(req.PackageSlugs) > 0 {
		allSlugs = append(allSlugs, req.PackageSlugs...)
	}

	// Deduplicate slugs
	slugMap := make(map[string]bool)
	var uniqueSlugs []string
	for _, s := range allSlugs {
		s = strings.TrimSpace(s)
		if s != "" && !slugMap[s] {
			slugMap[s] = true
			uniqueSlugs = append(uniqueSlugs, s)
		}
	}

	if len(uniqueSlugs) == 0 {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Paket tidak ditemukan"})
	}

	// Query packages from DB
	var pkgs []model.Package
	if err := connection.DB.Where("slug IN ?", uniqueSlugs).Find(&pkgs).Error; err != nil || len(pkgs) == 0 {
		var ids []uint
		for _, s := range uniqueSlugs {
			if idNum, err := strconv.Atoi(s); err == nil && idNum > 0 {
				ids = append(ids, uint(idNum))
			}
		}
		if len(ids) > 0 {
			connection.DB.Where("id IN ?", ids).Find(&pkgs)
		}
		if len(pkgs) == 0 {
			return c.JSON(http.StatusNotFound, Response{Status: false, Message: "Paket tidak ditemukan"})
		}
	}

	// Check if user already has an active and valid transaction for any of these packages
	for _, pkg := range pkgs {
		var existingCount int64
		connection.DB.Model(&model.Transaction{}).
			Where("user_id = ? AND package_id = ? AND status = ?", req.UserID, pkg.ID, "active").
			Where("(is_lifetime = ? OR active_until > ?)", true, time.Now()).
			Where("(max_exam_attempts = 0 OR used_exam_attempts < max_exam_attempts)").
			Count(&existingCount)

		if existingCount > 0 {
			return c.JSON(http.StatusBadRequest, Response{
				Status:  false,
				Message: fmt.Sprintf("Anda sudah memiliki paket aktif '%s'. Silakan langsung belajar.", pkg.Title),
			})
		}
	}

	// Check voucher
	var voucher *model.Voucher
	if req.VoucherCode != "" {
		var v model.Voucher
		if err := connection.DB.Where("code = ?", req.VoucherCode).First(&v).Error; err == nil {
			v.PopulateApplicablePackages()
			if v.Status == "active" && v.Used < v.Limit {
				var usage model.VoucherUsage
				if err := connection.DB.Where("voucher_id = ? AND user_id = ?", v.ID, req.UserID).First(&usage).Error; err != nil {
					voucher = &v
				}
			}
		}
	}

	// Get Setting for PPN
	var setting model.Setting
	connection.DB.First(&setting)
	ppn := setting.Ppn

	remainingFixedBudget := 0.0
	if voucher != nil && voucher.Type == "fixed" {
		remainingFixedBudget = voucher.Value
	}

	tx := connection.DB.Begin()

	dateStr := time.Now().Format("20060102")
	randomBytes := make([]byte, 2)
	rand.Read(randomBytes)
	orderID := fmt.Sprintf("KTN-%s-%s", dateStr, strings.ToUpper(hex.EncodeToString(randomBytes)))

	var groupInvoiceCode string
	for {
		groupInvoiceCode = generateInvoiceCode()
		var count int64
		tx.Model(&model.Transaction{}).Where("invoice_code = ? OR invoice_group = ?", groupInvoiceCode, groupInvoiceCode).Count(&count)
		if count == 0 {
			break
		}
	}

	var createdTransactions []model.Transaction
	var totalDiscount float64 = 0
	var totalAmount float64 = 0
	var totalFinalAmount float64 = 0
	var pkgTitles []string

	for i, pkg := range pkgs {
		pkgTitles = append(pkgTitles, pkg.Title)
		totalAmount += pkg.Price

		var invoiceCode string
		if len(pkgs) == 1 {
			invoiceCode = groupInvoiceCode
		} else {
			invoiceCode = fmt.Sprintf("%s-%d", groupInvoiceCode, i+1)
		}

		var pkgDiscount float64 = 0
		var vId *uint = nil

		if voucher != nil && voucher.IsApplicableToPackage(pkg.ID) {
			vId = &voucher.ID
			if voucher.Type == "percentage" {
				pkgDiscount = pkg.Price * (voucher.Value / 100.0)
			} else {
				pkgDiscount = math.Min(pkg.Price, remainingFixedBudget)
				remainingFixedBudget -= pkgDiscount
			}
		}

		totalDiscount += pkgDiscount
		netAmount := pkg.Price - pkgDiscount
		if netAmount < 0 {
			netAmount = 0
		}

		var ppnAmount float64 = 0
		if ppn > 0 {
			ppnAmount = netAmount * (ppn / 100.0)
		}
		finalPkgAmount := netAmount + ppnAmount
		totalFinalAmount += finalPkgAmount

		status := "pending payment"
		if finalPkgAmount == 0 {
			status = "active"
		}

		var activeUntil *time.Time
		if status == "active" {
			if !pkg.IsLifetime {
				durationDays := 30
				if pkg.ValidityDays > 0 {
					durationDays = pkg.ValidityDays
				}
				t := time.Now().AddDate(0, 0, durationDays)
				activeUntil = &t
			}
		}

		t := model.Transaction{
			InvoiceCode:     invoiceCode,
			InvoiceGroup:    groupInvoiceCode,
			OrderID:         orderID,
			UserID:          req.UserID,
			PackageID:       pkg.ID,
			VoucherID:       vId,
			Amount:          finalPkgAmount,
			PaymentMethod:   "qris",
			Status:          status,
			IsLifetime:      pkg.IsLifetime,
			MaxExamAttempts: pkg.MaxExamAttempts,
			ActiveUntil:     activeUntil,
		}

		if err := tx.Create(&t).Error; err != nil {
			tx.Rollback()
			return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal membuat transaksi"})
		}
		createdTransactions = append(createdTransactions, t)

		// If pkg is a bundle, create child transactions for all sub-packages in the bundle
		if pkg.IsBundle {
			subIDs := pkg.GetBundledPackageIDs()
			if len(subIDs) > 0 {
				var subPkgs []model.Package
				connection.DB.Where("id IN ?", subIDs).Find(&subPkgs)
				for subIdx, sp := range subPkgs {
					var subActiveUntil *time.Time
					if status == "active" {
						if !sp.IsLifetime {
							durationDays := 30
							if sp.ValidityDays > 0 {
								durationDays = sp.ValidityDays
							}
							t := time.Now().AddDate(0, 0, durationDays)
							subActiveUntil = &t
						}
					}
					subTx := model.Transaction{
						InvoiceCode:     fmt.Sprintf("%s-b%d-%d", invoiceCode, sp.ID, subIdx+1),
						InvoiceGroup:    groupInvoiceCode,
						OrderID:         orderID,
						UserID:          req.UserID,
						PackageID:       sp.ID,
						VoucherID:       nil,
						Amount:          0, // Free granted as part of bundle
						PaymentMethod:   "qris",
						Status:          status,
						IsLifetime:      sp.IsLifetime,
						MaxExamAttempts: sp.MaxExamAttempts,
						ActiveUntil:     subActiveUntil,
					}
					if err := tx.Create(&subTx).Error; err != nil {
						tx.Rollback()
						return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal membuat transaksi item bundle"})
					}
				}
			}
		}
	}

	if totalFinalAmount == 0 && voucher != nil && totalDiscount > 0 {
		usage := model.VoucherUsage{
			VoucherID: voucher.ID,
			OrderID:   orderID,
			UserID:    req.UserID,
			PackageID: pkgs[0].ID,
			Amount:    totalDiscount,
			Date:      time.Now().Format("2006-01-02 15:04:05"),
		}
		if err := tx.Create(&usage).Error; err != nil {
			tx.Rollback()
			return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal mencatat pemakaian voucher"})
		}
		if err := tx.Model(&model.Voucher{}).Where("id = ?", voucher.ID).UpdateColumn("used", gorm.Expr("used + ?", 1)).Error; err != nil {
			tx.Rollback()
			return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal mengupdate kuota voucher"})
		}
		if voucher.Used+1 >= voucher.Limit {
			tx.Model(&model.Voucher{}).Where("id = ?", voucher.ID).Update("status", "finished")
		}
	}

	tx.Commit()

	// Send email notification to Admin asynchronously
	go func() {
		receiver := os.Getenv("MAIL_RECEIVER")
		if receiver != "" {
			var user model.User
			if err := connection.DB.Where("id = ?", req.UserID).First(&user).Error; err == nil {
				subject := fmt.Sprintf("Pesanan Baru: %s", strings.Join(pkgTitles, ", "))

				var tableRows strings.Builder
				for i, txItem := range createdTransactions {
					pkgTitle := pkgs[i].Title
					pkgPrice := pkgs[i].Price
					pkgSubtotal := txItem.Amount

					pkgDiscount := 0.0
					vCode := ""
					if txItem.VoucherID != nil && voucher != nil {
						vCode = voucher.Code
						if voucher.Type == "percentage" {
							pkgDiscount = pkgPrice * (voucher.Value / 100.0)
						} else {
							pkgDiscount = math.Min(pkgPrice, voucher.Value)
						}
					}

					discountDisplay := `<span style="color: #94A3B8;">-</span>`
					if pkgDiscount > 0 {
						discountDisplay = fmt.Sprintf(`<span style="color: #059669; font-weight: 600;">-%s<br><small style="color: #64748B; font-size: 11px;">(%s)</small></span>`, formatRupiah(pkgDiscount), vCode)
					}

					subInvoiceText := ""
					if len(createdTransactions) > 1 && txItem.InvoiceCode != groupInvoiceCode {
						subInvoiceText = fmt.Sprintf(`<div style="font-size: 11px; color: #64748B; margin-top: 2px;">Sub: %s</div>`, txItem.InvoiceCode)
					}

					tableRows.WriteString(fmt.Sprintf(`
						<tr style="border-bottom: 1px solid #E2E8F0;">
							<td style="padding: 12px 10px; text-align: center; color: #64748B; font-size: 13px; vertical-align: middle;">%d</td>
							<td style="padding: 12px 10px; vertical-align: middle;">
								<div style="font-weight: 600; color: #0F172A; font-size: 14px;">%s</div>
								%s
							</td>
							<td style="padding: 12px 10px; text-align: right; color: #475569; font-size: 13px; vertical-align: middle; white-space: nowrap;">%s</td>
							<td style="padding: 12px 10px; text-align: right; font-size: 13px; vertical-align: middle; white-space: nowrap;">%s</td>
							<td style="padding: 12px 10px; text-align: right; font-weight: 700; color: #0F172A; font-size: 13px; vertical-align: middle; white-space: nowrap;">%s</td>
						</tr>
					`, i+1, pkgTitle, subInvoiceText, formatRupiah(pkgPrice), discountDisplay, formatRupiah(pkgSubtotal)))
				}

				statusBadge := "MENUNGGU PEMBAYARAN"
				statusBg := "rgba(255, 255, 255, 0.2)"
				if totalFinalAmount == 0 {
					statusBadge = "LUNAS / SUKSES"
					statusBg = "#059669"
				}

				discountRow := ""
				if totalDiscount > 0 {
					discountRow = fmt.Sprintf(`
						<tr>
							<td style="font-size: 13px; color: #059669; font-weight: 600;">Diskon Voucher:</td>
							<td style="font-size: 13px; font-weight: 700; color: #059669; text-align: right;">-%s</td>
						</tr>
					`, formatRupiah(totalDiscount))
				}

				var totalPpn float64 = 0
				if ppn > 0 {
					netTotal := totalAmount - totalDiscount
					if netTotal > 0 {
						totalPpn = netTotal * (ppn / 100.0)
					}
				}

				ppnRow := ""
				if totalPpn > 0 {
					ppnRow = fmt.Sprintf(`
						<tr>
							<td style="font-size: 13px; color: #64748B;">PPN (%.0f%%):</td>
							<td style="font-size: 13px; font-weight: 600; color: #1E293B; text-align: right;">%s</td>
						</tr>
					`, ppn, formatRupiah(totalPpn))
				}

				itemCountStr := "1 Paket (Satuan)"
				if len(createdTransactions) > 1 {
					itemCountStr = fmt.Sprintf("%d Paket (Keranjang)", len(createdTransactions))
				}

				tmpl := `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Invoice Pesanan Baru</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F3F4F6; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F3F4F6; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #E5E7EB;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%); padding: 28px 32px; color: #FFFFFF;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #93C5FD; margin-bottom: 4px;">PEMBERITAHUAN PESANAN BARU</div>
                    <div style="font-size: 22px; font-weight: 800; color: #FFFFFF; margin: 0;">Rifaya Tryout</div>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="background: {{STATUS_BG}}; color: #FFFFFF; font-size: 11px; font-weight: 700; padding: 6px 14px; border-radius: 9999px; border: 1px solid rgba(255, 255, 255, 0.3); text-transform: uppercase; letter-spacing: 0.5px;">
                      {{STATUS_BADGE}}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Invoice Details Bar -->
          <tr>
            <td style="padding: 18px 32px; background-color: #F8FAFC; border-bottom: 1px solid #E2E8F0;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align: top; width: 50%;">
                    <div style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">Nomor Invoice</div>
                    <div style="font-size: 15px; font-weight: 800; color: #1E293B; margin-top: 2px;">{{INVOICE_CODE}}</div>
                  </td>
                  <td align="right" style="vertical-align: top; width: 50%;">
                    <div style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">Waktu Transaksi</div>
                    <div style="font-size: 13px; font-weight: 600; color: #334155; margin-top: 2px;">{{TRANSACTION_DATE}}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Customer Info -->
          <tr>
            <td style="padding: 24px 32px 16px 32px;">
              <div style="background-color: #F8FAFC; border-radius: 12px; padding: 16px 20px; border: 1px solid #E2E8F0;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="width: 50%; vertical-align: top;">
                      <div style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase;">Informasi Pembeli</div>
                      <div style="font-size: 14px; font-weight: 700; color: #0F172A; margin-top: 4px;">{{USER_NAME}}</div>
                      <div style="font-size: 13px; color: #475569;">{{USER_EMAIL}}</div>
                    </td>
                    <td style="width: 50%; vertical-align: top;" align="right">
                      <div style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase;">Metode & Jenis</div>
                      <div style="font-size: 14px; font-weight: 700; color: #0F172A; margin-top: 4px;">QRIS / Transfer</div>
                      <div style="font-size: 12px; color: #64748B;">{{ITEM_COUNT}}</div>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td style="padding: 10px 32px 20px 32px;">
              <div style="font-size: 13px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">Rincian Paket Dipesan</div>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; width: 100%;">
                <thead>
                  <tr style="background-color: #F1F5F9; border-top: 1px solid #CBD5E1; border-bottom: 1px solid #CBD5E1;">
                    <th style="padding: 10px 8px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; width: 35px;">No</th>
                    <th style="padding: 10px 8px; text-align: left; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Item Paket</th>
                    <th style="padding: 10px 8px; text-align: right; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Harga</th>
                    <th style="padding: 10px 8px; text-align: right; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Diskon</th>
                    <th style="padding: 10px 8px; text-align: right; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {{TABLE_ROWS}}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Summary Breakdown -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                <tr>
                  <td style="width: 40%;"></td>
                  <td style="width: 60%;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="4">
                      <tr>
                        <td style="font-size: 13px; color: #64748B;">Total Harga Paket:</td>
                        <td style="font-size: 13px; font-weight: 600; color: #1E293B; text-align: right;">{{TOTAL_AMOUNT}}</td>
                      </tr>
                      {{DISCOUNT_ROW}}
                      {{PPN_ROW}}
                      <tr>
                        <td colspan="2" style="padding-top: 8px;"><div style="border-top: 2px solid #E2E8F0;"></div></td>
                      </tr>
                      <tr>
                        <td style="font-size: 14px; font-weight: 800; color: #0F172A; padding-top: 4px;">Total Tagihan:</td>
                        <td style="font-size: 18px; font-weight: 900; color: #2563EB; text-align: right; padding-top: 4px;">{{TOTAL_FINAL_AMOUNT}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer / Action -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 24px 32px; text-align: center; border-radius: 0 0 16px 16px;">
              <p style="margin: 0 0 16px 0; font-size: 13px; color: #64748B;">
                Silakan lakukan verifikasi dan aktivasi paket melalui Dashboard Admin.
              </p>
              <a href="http://localhost:3000/admin/transactions" style="display: inline-block; background-color: #2563EB; color: #FFFFFF; font-size: 13px; font-weight: 700; text-decoration: none; padding: 10px 24px; border-radius: 8px;">
                Buka Dashboard Admin &rarr;
              </a>
              <div style="margin-top: 18px; font-size: 11px; color: #94A3B8;">
                Email notifikasi otomatis dari Rifaya Tryout System.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

				replacer := strings.NewReplacer(
					"{{STATUS_BG}}", statusBg,
					"{{STATUS_BADGE}}", statusBadge,
					"{{INVOICE_CODE}}", groupInvoiceCode,
					"{{TRANSACTION_DATE}}", time.Now().Format("02 Jan 2006 15:04:05 WIB"),
					"{{USER_NAME}}", user.Name,
					"{{USER_EMAIL}}", user.Email,
					"{{ITEM_COUNT}}", itemCountStr,
					"{{TABLE_ROWS}}", tableRows.String(),
					"{{TOTAL_AMOUNT}}", formatRupiah(totalAmount),
					"{{DISCOUNT_ROW}}", discountRow,
					"{{PPN_ROW}}", ppnRow,
					"{{TOTAL_FINAL_AMOUNT}}", formatRupiah(totalFinalAmount),
				)

				body := replacer.Replace(tmpl)

				_ = SendEmail(receiver, subject, body)
			}
		}
	}()

	var firstTx model.Transaction
	if len(createdTransactions) > 0 {
		firstTx = createdTransactions[0]
	}

	return c.JSON(http.StatusOK, Response{Status: true, Message: "Checkout berhasil diproses", Data: firstTx})
}
