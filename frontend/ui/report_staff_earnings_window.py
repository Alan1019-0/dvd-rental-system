from PySide6.QtWidgets import *
from api import APIClient, APIError

class ReportStaffEarningsWindow(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.api = APIClient()
        self.setWindowTitle("Ganancias por Staff")
        self.resize(700, 420)

        layout = QVBoxLayout()
        form = QFormLayout()

        self.staff = QLineEdit()
        self.fro = QLineEdit()
        self.to = QLineEdit()

        form.addRow("Staff ID:", self.staff)
        form.addRow("Desde (YYYY-MM-DD):", self.fro)
        form.addRow("Hasta:", self.to)
        layout.addLayout(form)

        self.table = QTableWidget(0, 3)
        self.table.setHorizontalHeaderLabels(["Staff ID", "Nombre", "Ganancias"])
        layout.addWidget(self.table)

        btns = QHBoxLayout()
        self.load_btn = QPushButton("Cargar")
        btns.addStretch()
        btns.addWidget(self.load_btn)
        layout.addLayout(btns)

        self.setLayout(layout)
        self.load_btn.clicked.connect(self.load)

    def load(self):
        try:
            data = self.api.get_staff_earnings(
                self.staff.text().strip() or None,
                self.fro.text().strip() or None,
                self.to.text().strip() or None
            )

            rows = data.get("data", data) if isinstance(data, dict) else data
            if not isinstance(rows, list):
                rows = [rows]

            self.table.setRowCount(0)
            for r in rows:
                row = self.table.rowCount()
                self.table.insertRow(row)
                for col, key in enumerate(["staff_id", "staff_name", "total_earnings"]):
                    self.table.setItem(row, col, QTableWidgetItem(str(r.get(key))))
        except APIError as e:
            QMessageBox.critical(self, "Error", str(e))
