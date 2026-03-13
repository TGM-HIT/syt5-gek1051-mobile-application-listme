package com.oliwier.listmebackend.domain.service;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.oliwier.listmebackend.domain.model.Item;
import com.oliwier.listmebackend.domain.model.ShoppingList;
import com.oliwier.listmebackend.domain.repository.ItemRepository;
import com.oliwier.listmebackend.domain.repository.ShoppingListRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.*;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ExportService {

    private final ShoppingListRepository listRepository;
    private final ItemRepository itemRepository;

    @Transactional(readOnly = true)
    public byte[] exportCsv(UUID listId) {
        List<Item> items = itemRepository.findByListIdAndDeletedAtIsNullOrderByPosition(listId);

        StringBuilder sb = new StringBuilder();
        sb.append("Name,Menge,Einheit,Preis,Kategorie,Erledigt\n");

        for (Item item : items) {
            sb.append(csvEscape(item.getName())).append(',');
            sb.append(item.getQuantity() != null ? item.getQuantity().toPlainString() : "").append(',');
            sb.append(csvEscape(item.getQuantityUnit() != null ? item.getQuantityUnit() : "")).append(',');
            sb.append(item.getPrice() != null ? item.getPrice().toPlainString() : "").append(',');
            sb.append(csvEscape(item.getCategory() != null ? item.getCategory().getName() : "")).append(',');
            sb.append(item.isChecked() ? "Ja" : "Nein").append('\n');
        }

        return sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    @Transactional(readOnly = true)
    public byte[] exportPdf(UUID listId) {
        ShoppingList list = listRepository.findById(listId)
                .orElseThrow(() -> new IllegalArgumentException("List not found"));
        List<Item> items = itemRepository.findByListIdAndDeletedAtIsNullOrderByPosition(listId);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 40, 40, 50, 40);

        try {
            PdfWriter.getInstance(doc, out);
            doc.open();

            // Title
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, new Color(0x4c, 0x4f, 0x69));
            String title = list.getEmoji() + "  " + list.getName();
            doc.add(new Paragraph(title, titleFont));
            doc.add(new Paragraph(" "));

            // Summary line
            long doneCount = items.stream().filter(Item::isChecked).count();
            Font subFont = FontFactory.getFont(FontFactory.HELVETICA, 10, new Color(0x6c, 0x6f, 0x85));
            doc.add(new Paragraph(doneCount + " / " + items.size() + " erledigt", subFont));
            doc.add(new Paragraph(" "));

            if (items.isEmpty()) {
                doc.add(new Paragraph("Keine Artikel.", subFont));
                doc.close();
                return out.toByteArray();
            }

            // Table
            PdfPTable table = new PdfPTable(new float[]{4f, 1.5f, 1.5f, 1.5f, 1f});
            table.setWidthPercentage(100);
            table.setSpacingBefore(4f);

            // Header row
            Color headerBg = new Color(0xcc, 0xd0, 0xda);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, new Color(0x4c, 0x4f, 0x69));
            for (String col : new String[]{"Artikel", "Menge", "Einheit", "Preis", "✓"}) {
                PdfPCell cell = new PdfPCell(new Phrase(col, headerFont));
                cell.setBackgroundColor(headerBg);
                cell.setPadding(6);
                cell.setBorderColor(new Color(0xbc, 0xc0, 0xcc));
                table.addCell(cell);
            }

            // Item rows
            Font rowFont = FontFactory.getFont(FontFactory.HELVETICA, 9, new Color(0x4c, 0x4f, 0x69));
            Font doneFont = FontFactory.getFont(FontFactory.HELVETICA, 9, new Color(0x9c, 0xa0, 0xb0));
            Color rowAlt = new Color(0xe6, 0xe9, 0xef);

            for (int i = 0; i < items.size(); i++) {
                Item item = items.get(i);
                Font f = item.isChecked() ? doneFont : rowFont;
                Color rowBg = (i % 2 == 0) ? Color.WHITE : rowAlt;

                String[] values = {
                        (item.isChecked() ? "✓ " : "") + item.getName(),
                        item.getQuantity() != null ? item.getQuantity().stripTrailingZeros().toPlainString() : "",
                        item.getQuantityUnit() != null ? item.getQuantityUnit() : "",
                        item.getPrice() != null ? "€ " + item.getPrice().setScale(2, java.math.RoundingMode.HALF_UP).toPlainString() : "",
                        item.isChecked() ? "Ja" : "Nein"
                };

                for (String val : values) {
                    PdfPCell cell = new PdfPCell(new Phrase(val, f));
                    cell.setBackgroundColor(rowBg);
                    cell.setPadding(5);
                    cell.setBorderColor(new Color(0xbc, 0xc0, 0xcc));
                    table.addCell(cell);
                }
            }

            doc.add(table);

            // Total line
            BigDecimal total = items.stream()
                    .filter(it -> !it.isChecked() && it.getPrice() != null)
                    .map(Item::getPrice)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            if (total.compareTo(BigDecimal.ZERO) > 0) {
                doc.add(new Paragraph(" "));
                Font totalFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, new Color(0x17, 0x92, 0x99));
                doc.add(new Paragraph("Geschätztes Budget: € " +
                        total.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString(), totalFont));
            }

        } finally {
            doc.close();
        }

        return out.toByteArray();
    }

    private static String csvEscape(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
