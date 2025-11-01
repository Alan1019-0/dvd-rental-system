import sys
from PySide6.QtWidgets import QApplication, QMainWindow, QPushButton, QVBoxLayout, QWidget
from PySide6.QtCore import Qt, QSize
from ui.rental_create_window import RentalCreateWindow
from ui.rental_return_window import RentalReturnWindow
from ui.rental_cancel_window import RentalCancelWindow
from ui.report_not_returned_window import ReportNotReturnedWindow
from ui.report_top_dvds_window import ReportTopDvdsWindow
from ui.report_staff_earnings_window import ReportStaffEarningsWindow
from ui.customer_rentals_window import CustomerRentalsWindow

def set_dark_palette(app):
    app.setStyle("Fusion")
    from PySide6.QtGui import QPalette, QColor
    p = QPalette()
    
    p.setColor(QPalette.Window, QColor(37, 37, 38))
    p.setColor(QPalette.WindowText, Qt.white)
    p.setColor(QPalette.Base, QColor(25, 25, 25))
    p.setColor(QPalette.AlternateBase, QColor(37, 37, 38))
    p.setColor(QPalette.ToolTipBase, Qt.white)
    p.setColor(QPalette.ToolTipText, Qt.white)
    p.setColor(QPalette.Text, Qt.white)
    p.setColor(QPalette.Button, QColor(53, 53, 53))
    p.setColor(QPalette.ButtonText, Qt.white)
    p.setColor(QPalette.Highlight, QColor(42, 130, 218))
    p.setColor(QPalette.HighlightedText, Qt.white)

    app.setPalette(p)

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Sistema de Renta de DVDs")
        self.setMinimumSize(QSize(720, 520))
        self.init_ui()

    def init_ui(self):
        layout = QVBoxLayout()
        layout.setSpacing(12)
        layout.setContentsMargins(18, 18, 18, 18)

        buttons = [
            ("Crear Renta", RentalCreateWindow),
            ("Registrar Devolución", RentalReturnWindow),
            ("Cancelar Renta", RentalCancelWindow),
            ("Reporte: DVDs No Devueltos", ReportNotReturnedWindow),
            ("Reporte: DVDs Más Rentados", ReportTopDvdsWindow),
            ("Reporte: Ganancia por Staff", ReportStaffEarningsWindow),
            ("Rentas por Cliente", CustomerRentalsWindow),
        ]

        for text, window in buttons:
            btn = QPushButton(text)
            btn.setMinimumHeight(42)
            btn.clicked.connect(lambda _, w=window: w(self).exec())
            layout.addWidget(btn)

        container = QWidget()
        container.setLayout(layout)
        self.setCentralWidget(container)

if __name__ == "__main__":
    app = QApplication(sys.argv)
    set_dark_palette(app)
    window = MainWindow()
    window.show()
    sys.exit(app.exec())
