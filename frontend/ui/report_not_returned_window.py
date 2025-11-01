from PySide6.QtWidgets import *
from api import APIClient, APIError

class ReportNotReturnedWindow(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.api = APIClient()
        self.setWindowTitle("DVDs No Devueltos")
        self.resize(900, 420)

        layout = QVBoxLayout()

        top = QHBoxLayout()
        top.addWidget(QLabel("Días de atraso:"))
        self.days = QSpinBox()
        top.addWidget(self.days)
        self.load_btn = QPushButton("Cargar")
        top.addWidget(self.load_btn)
        layout.addLayout(top)

        self.table = QTableWidget(0, 6)
        self.table.setHorizontalHeaderLabels([
            "Rental ID", "Fecha Renta", "Días Atraso", "Cliente", "Título", "Staff"
        ])
        self.table.horizontalHeader().setStretchLastSection(True)
        layout.addWidget(self.table)

        close = QPushButton("Cerrar")
        close.clicked.connect(self.close)
        layout.addWidget(close)

        self.setLayout(layout)
        self.load_btn.clicked.connect(self.load)
        self.load()

    def load(self):
        try:
            data = self.api.get_not_returned(self.days.value())
            rows = data.get("unreturned_dvds", [])
            self.table.setRowCount(0)
            for r in rows:
                row = self.table.rowCount()
                self.table.insertRow(row)
                for col, key in enumerate(["rental_id","rental_date","days_overdue","customer_name","film_title","staff_name"]):
                    self.table.setItem(row, col, QTableWidgetItem(str(r.get(key))))
        except APIError as e:
            QMessageBox.critical(self, "Error", str(e))
