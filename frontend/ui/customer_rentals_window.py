from PySide6.QtWidgets import *
from api import APIClient, APIError

class CustomerRentalsWindow(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.api = APIClient()
        self.setWindowTitle("Rentas de un Cliente")
        self.resize(900, 420)

        layout = QVBoxLayout()
        form = QFormLayout()

        self.cid = QLineEdit()
        form.addRow("Customer ID:", self.cid)
        layout.addLayout(form)

        self.table = QTableWidget(0, 5)
        self.table.setHorizontalHeaderLabels(["Rental ID", "Fecha", "Inventory", "Devuelto", "Staff"])
        layout.addWidget(self.table)

        btns = QHBoxLayout()
        self.load_btn = QPushButton("Cargar")
        btns.addStretch()
        btns.addWidget(self.load_btn)
        layout.addLayout(btns)

        self.setLayout(layout)
        self.load_btn.clicked.connect(self.load_data)

    def load_data(self):
        try:
            data = self.api.get_rentals_by_customer(self.cid.text().strip())
            rows = data.get("rentals", [])
            self.table.setRowCount(0)
            for r in rows:
                row = self.table.rowCount()
                self.table.insertRow(row)
                for col, key in enumerate(["rental_id","rental_date","inventory_id","return_date","staff_id"]):
                    self.table.setItem(row, col, QTableWidgetItem(str(r.get(key))))
        except APIError as e:
            QMessageBox.critical(self, "Error", str(e))
