from PySide6.QtWidgets import *
from api import APIClient, APIError

class ReportTopDvdsWindow(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.api = APIClient()
        self.setWindowTitle("DVDs Más Rentados")
        self.resize(800, 420)

        layout = QVBoxLayout()

        top = QHBoxLayout()
        top.addWidget(QLabel("Top:"))
        self.limit = QSpinBox()
        self.limit.setValue(10)
        top.addWidget(self.limit)
        self.btn = QPushButton("Cargar")
        top.addWidget(self.btn)
        layout.addLayout(top)

        self.table = QTableWidget(0, 5)
        self.table.setHorizontalHeaderLabels(["Film ID", "Título", "Categoría", "Total Rentas", "Ganancias"])
        self.table.horizontalHeader().setStretchLastSection(True)
        layout.addWidget(self.table)

        close = QPushButton("Cerrar")
        close.clicked.connect(self.close)
        layout.addWidget(close)

        self.setLayout(layout)
        self.btn.clicked.connect(self.load)
        self.load()

    def load(self):
        try:
            data = self.api.get_top_dvds(self.limit.value())
            rows = data.get("top_films", [])
            self.table.setRowCount(0)
            for f in rows:
                row = self.table.rowCount()
                self.table.insertRow(row)
                for col, key in enumerate(["film_id","title","category","total_rentals","total_revenue"]):
                    self.table.setItem(row, col, QTableWidgetItem(str(f.get(key))))
        except APIError as e:
            QMessageBox.critical(self, "Error", str(e))
