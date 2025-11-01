from PySide6.QtWidgets import *
from api import APIClient, APIError

class RentalReturnWindow(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.api = APIClient()
        self.setWindowTitle("Registrar Devolución")
        self.resize(600, 240)

        layout = QVBoxLayout()
        form = QFormLayout()

        self.rental_input = QLineEdit()
        form.addRow("Rental ID:", self.rental_input)
        layout.addLayout(form)

        self.info_label = QLabel("Carga una renta para ver detalles.")
        layout.addWidget(self.info_label)

        btns = QHBoxLayout()
        self.load_btn = QPushButton("Cargar")
        self.return_btn = QPushButton("Registrar Devolución")
        btns.addStretch()
        btns.addWidget(self.load_btn)
        btns.addWidget(self.return_btn)
        layout.addLayout(btns)

        self.setLayout(layout)

        self.load_btn.clicked.connect(self.load_rental)
        self.return_btn.clicked.connect(self.return_rental)

    def load_rental(self):
        rid = self.rental_input.text().strip()
        try:
            data = self.api.get_rental(rid)
            d = data.get("data", data)
            self.info_label.setText(
                f"Rental {d.get('rental_id')} - Inventory {d.get('inventory_id')} - Return {d.get('return_date')}"
            )
        except APIError as e:
            QMessageBox.critical(self, "Error", str(e))

    def return_rental(self):
        rid = self.rental_input.text().strip()
        try:
            resp = self.api.return_rental(rid)
            QMessageBox.information(self, "Éxito", str(resp))
            self.accept()
        except APIError as e:
            QMessageBox.critical(self, "Error", str(e))
