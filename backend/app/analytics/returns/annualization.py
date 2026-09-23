from app.models.enums import AssetType

class AnnualizationConvention:
    """
    Annualization trading/calendar days convention.
    Equities, ETFs, and Indices use 252 trading days.
    Crypto continuous markets use 365 calendar days.
    """
    @staticmethod
    def get_annualization_factor(asset_type: AssetType) -> int:
        if asset_type == AssetType.CRYPTO:
            return 365
        return 252
