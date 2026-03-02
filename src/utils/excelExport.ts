import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { OliveTree, Transaction, Field, TreeVariety, TreeHealth } from '../types';

export const exportToExcel = async (
    trees: OliveTree[],
    transactions: Transaction[],
    fields: Field[]
) => {
    // Create workbook and worksheets
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Olive Tracker';
    workbook.lastModifiedBy = 'Olive Tracker';
    workbook.created = new Date();
    workbook.modified = new Date();

    // 1. TREES WORKSHEET
    const treeSheet = workbook.addWorksheet('Δέντρα', {
        properties: { tabColor: { argb: 'FF84CC16' } } // Lime color
    });

    // Define columns
    treeSheet.columns = [
        { header: 'ID', key: 'id', width: 36 },
        { header: 'Ημερομηνία', key: 'dateAdded', width: 15 },
        { header: 'Ποικιλία', key: 'variety', width: 15 },
        { header: 'Υγεία', key: 'health', width: 15 },
        { header: 'Εκτίμηση (kg)', key: 'yieldEstimate', width: 15 },
        { header: 'Τοποθεσία (Lat)', key: 'lat', width: 15 },
        { header: 'Τοποθεσία (Lng)', key: 'lng', width: 15 },
        { header: 'Σημειώσεις', key: 'notes', width: 30 },
        { header: 'Εργασίες (Εκκρεμείς)', key: 'pendingTasks', width: 20 },
        { header: 'Συγκομιδή (Σύνολο kg)', key: 'totalHarvest', width: 20 },
        { header: 'Φωτογραφία', key: 'photo', width: 20 } // Empty column for images
    ];

    // Add rows and images
    for (const [index, tree] of trees.entries()) {
        const varietyLabels: Record<TreeVariety, string> = {
            koroneiki: 'Κορωνέικη',
            kalamon: 'Καλαμών',
            manaki: 'Μανάκι',
            other: 'Άλλη'
        };

        const healthLabels: Record<TreeHealth, string> = {
            good: 'Καλή',
            average: 'Μέτρια',
            poor: 'Κακή'
        };

        const pendingTasks = tree.tasks?.filter(t => t.status === 'pending').length || 0;
        const totalHarvest = tree.harvests?.reduce((sum, h) => sum + h.amountKg, 0) || 0;

        const row = treeSheet.addRow({
            id: tree.id,
            dateAdded: new Date(tree.dateAdded).toLocaleDateString('el-GR'),
            variety: varietyLabels[tree.variety],
            health: healthLabels[tree.health],
            yieldEstimate: tree.yieldEstimate,
            lat: tree.lat,
            lng: tree.lng,
            notes: tree.notes || '',
            pendingTasks: pendingTasks,
            totalHarvest: totalHarvest
        });

        // Add Image if exists
        if (tree.photoUrl) {
            try {
                // exceljs requires base64 without the data prefix
                const base64Data = tree.photoUrl.split(';base64,').pop();
                
                if (base64Data) {
                    const imageId = workbook.addImage({
                        base64: base64Data,
                        extension: 'jpeg', // Assuming jpeg/png, exceljs handles it well
                    });

                    // Add image to the 'photo' column (index 10 -> column K)
                    treeSheet.addImage(imageId, {
                        tl: { col: 10, row: row.number - 1 }, // 0-based index for col
                        ext: { width: 100, height: 100 },
                        editAs: 'oneCell'
                    });

                    // Set row height to accommodate image
                    row.height = 80;
                }
            } catch (error) {
                console.error('Error adding image to excel:', error);
            }
        }
    }

    // Style header row
    treeSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    treeSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4D7C0F' } // Lime-700
    };

    // 2. TRANSACTIONS WORKSHEET
    const transactionSheet = workbook.addWorksheet('Οικονομικά', {
        properties: { tabColor: { argb: 'FF3B82F6' } } // Blue color
    });

    transactionSheet.columns = [
        { header: 'Ημερομηνία', key: 'date', width: 15 },
        { header: 'Τύπος', key: 'type', width: 15 },
        { header: 'Κατηγορία', key: 'category', width: 15 },
        { header: 'Ποσό (€)', key: 'amount', width: 15 },
        { header: 'Περιγραφή', key: 'description', width: 30 }
    ];

    const categoryLabels: Record<string, string> = {
        sale: 'Πώληση',
        fertilizer: 'Λιπάσματα',
        labor: 'Εργατικά',
        equipment: 'Εξοπλισμός',
        fuel: 'Καύσιμα',
        other: 'Άλλα'
    };

    transactions.forEach(t => {
        transactionSheet.addRow({
            date: new Date(t.date).toLocaleDateString('el-GR'),
            type: t.type === 'income' ? 'Έσοδο' : 'Έξοδο',
            category: categoryLabels[t.category] || t.category,
            amount: t.amount,
            description: t.description
        });
    });

    // Style header
    transactionSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    transactionSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1D4ED8' } // Blue-700
    };

    // 3. HARVESTS LOG WORKSHEET (Aggregated)
    const harvestSheet = workbook.addWorksheet('Συγκομιδές', {
        properties: { tabColor: { argb: 'FFA855F7' } } // Purple
    });

    harvestSheet.columns = [
        { header: 'Ημερομηνία', key: 'date', width: 15 },
        { header: 'Δέντρο ID', key: 'treeId', width: 36 },
        { header: 'Ποικιλία', key: 'variety', width: 15 },
        { header: 'Ποσό (kg)', key: 'amount', width: 15 }
    ];

    // Flatten harvest data
    const allHarvests: any[] = [];
    trees.forEach(tree => {
        if (tree.harvests && tree.harvests.length > 0) {
            tree.harvests.forEach(h => {
                allHarvests.push({
                    date: h.date,
                    treeId: tree.id,
                    variety: tree.variety,
                    amount: h.amountKg
                });
            });
        }
    });

    // Sort by date desc
    allHarvests.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    allHarvests.forEach(h => {
        const varietyLabels: Record<TreeVariety, string> = {
            koroneiki: 'Κορωνέικη',
            kalamon: 'Καλαμών',
            manaki: 'Μανάκι',
            other: 'Άλλη'
        };

        harvestSheet.addRow({
            date: new Date(h.date).toLocaleDateString('el-GR'),
            treeId: h.treeId,
            variety: varietyLabels[h.variety as TreeVariety],
            amount: h.amount
        });
    });

    harvestSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    harvestSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF7E22CE' } // Purple-700
    };

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Save file
    const fileName = `OliveTracker_Data_${new Date().toISOString().slice(0, 10)}.xlsx`;
    saveAs(new Blob([buffer]), fileName);
};
