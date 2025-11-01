from PySide6.QtWidgets import *
from api import APIClient, APIError

class RentalCancelWindow(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.api = APIClient()
        self.setWindowTitle("Cancelar Renta")
        self.resize(520, 200)

        layout = QVBoxLayout()
        form = QFormLayout()

        self.rental_input = QLineEdit()
        self.reason_input = QLineEdit()
        form.addRow("Rental ID:", self.rental_input)
        form.addRow("Motivo:", self.reason_input)
        layout.addLayout(form)

        btns = QHBoxLayout()
        self.cancel_btn = QPushButton("Cancelar Renta")
        btns.addStretch()
        btns.addWidget(self.cancel_btn)
        layout.addLayout(btns)

        self.setLayout(layout)

        self.cancel_btn.clicked.connect(self.cancel_rental)

    def cancel_rental(self):
        rid = self.rental_input.text().strip()
        try:
            resp = self.api.cancel_rental(rid)
            QMessageBox.information(self, "Éxito", str(resp))
            self.accept()
        except APIError as e:
            QMessageBox.critical(self, "Error", str(e))
