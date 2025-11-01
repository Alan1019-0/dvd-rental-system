from PySide6.QtWidgets import *
from PySide6.QtCore import Qt
from api import APIClient, APIError

class RentalCreateWindow(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.api = APIClient()
        self.setWindowTitle("Crear Renta")
        self.resize(700, 420)
        self.setMinimumSize(700, 420)

        layout = QVBoxLayout()
        form = QFormLayout()

        self.customer_combo = QComboBox()
        self.inventory_table = QTableWidget(0, 4)
        self.inventory_table.setHorizontalHeaderLabels(["Inventory ID", "Título", "Store", "Disponible"])
        self.inventory_table.horizontalHeader().setStretchLastSection(True)
        self.inventory_table.setSelectionBehavior(QTableWidget.SelectRows)
        self.inventory_table.setEditTriggers(QTableWidget.NoEditTriggers)

        self.staff_input = QLineEdit()
        self.staff_input.setPlaceholderText("ID del empleado (p.ej. 1)")

        form.addRow("Cliente:", self.customer_combo)
        form.addRow("Inventario disponible:", self.inventory_table)
        form.addRow("Staff ID:", self.staff_input)

        layout.addLayout(form)

        btn_layout = QHBoxLayout()
        self.create_btn = QPushButton("Crear Renta")
        self.cancel_btn = QPushButton("Cerrar")
        btn_layout.addStretch()
        btn_layout.addWidget(self.create_btn)
        btn_layout.addWidget(self.cancel_btn)
        layout.addLayout(btn_layout)

        self.setLayout(layout)

        self.create_btn.clicked.connect(self.create_rental)
        self.cancel_btn.clicked.connect(self.close)

        self.load_customers()
        self.load_inventory()

    def load_customers(self):
        try:
            data = self.api.get_customers()
            self.customer_combo.clear()
            for c in data:
                desc = f"{c.get('customer_id')} - {c.get('first_name')} {c.get('last_name')}"
                self.customer_combo.addItem(desc, c.get("customer_id"))
        except APIError as e:
            QMessageBox.critical(self, "Error", f"No se pudieron cargar clientes:\n{e}")

    def load_inventory(self):
        try:
            items = self.api.get_available_inventory()
            self.inventory_table.setRowCount(0)
            for it in items:
                r = self.inventory_table.rowCount()
                self.inventory_table.insertRow(r)
                inventory_id = it.get("inventory_id") or it.get("inventoryId") or it.get("id")
                title = it.get("title") or it.get("film_title")
                self.inventory_table.setItem(r, 0, QTableWidgetItem(str(inventory_id)))
                self.inventory_table.setItem(r, 1, QTableWidgetItem(str(title)))
                self.inventory_table.setItem(r, 2, QTableWidgetItem(str(it.get("store_id", ""))))
                self.inventory_table.setItem(r, 3, QTableWidgetItem("Sí"))
        except APIError as e:
            QMessageBox.critical(self, "Error", str(e))

    def create_rental(self):
        r = self.inventory_table.currentRow()
        if r < 0:
            QMessageBox.warning(self, "Atención", "Selecciona un ítem")
            return

        inventory_id = self.inventory_table.item(r, 0).text()
        customer_id = self.customer_combo.currentData()
        staff_id = self.staff_input.text().strip() or "1"

        try:
            resp = self.api.create_rental(customer_id, inventory_id, staff_id)
            QMessageBox.information(self, "Éxito", f"Renta creada:\n{resp}")
            self.accept()
        except APIError as e:
            QMessageBox.critical(self, "Error", str(e))
