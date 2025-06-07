from exporters.base_exporter import BaseExporter


class ExporterFactory:
    """Factory class for creating exporter instances."""
    
    _exporters = {}  # Registry of available exporters
    
    @classmethod
    def register_exporter(cls, exporters: list[type]):
        """Register multiple exporter types.
        
        Args:
            exporters: List of exporter classes to register
        """
        for exporter in exporters:
            cls._exporters[exporter.get_exporter_type()] = exporter
    
    @classmethod
    def get_exporter(cls, exporter_type: str) -> 'BaseExporter':
        """Factory method to get the appropriate exporter instance."""
        if exporter_type not in cls._exporters:
            raise ValueError(f"Exporter type '{exporter_type}' not supported")
        return cls._exporters[exporter_type]()

