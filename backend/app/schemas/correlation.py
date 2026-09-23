from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, Field, ConfigDict

class MatrixCellItem(BaseModel):
    symbol_a: str
    symbol_b: str
    correlation: Optional[float] = Field(default=None, description="Pearson correlation coefficient (-1.0 to 1.0) or None if undefined")
    observations: int = Field(default=0, description="Aligned return observation count")
    interpretation: str = Field(default="", description="Descriptive qualitative correlation range")

class CorrelationMatrixResponse(BaseModel):
    instruments: List[str] = Field(default_factory=list, description="List of instrument symbols analyzed")
    instrument_ids: List[str] = Field(default_factory=list, description="List of instrument UUIDs analyzed")
    method: str = Field(default="pearson", description="Correlation method used")
    return_type: str = Field(default="simple", description="Return series type: 'simple' or 'log'")
    price_source: str = Field(default="adjusted", description="Price series source: 'adjusted' or 'close'")
    alignment: str = Field(default="pairwise_complete", description="Alignment mode: 'pairwise_complete' or 'common_intersection'")
    matrix: List[List[Optional[float]]] = Field(default_factory=list, description="2D NxN correlation matrix")
    pairwise: List[MatrixCellItem] = Field(default_factory=list, description="Flat list of unique pairwise correlations")
    quality_status: str = Field(default="GOOD", description="Overall market data quality status")
    quality_warnings: List[str] = Field(default_factory=list, description="Data quality or coverage warnings")

class ScatterPointItem(BaseModel):
    timestamp: datetime
    return_a: float
    return_b: float

class CorrelationPairwiseResponse(BaseModel):
    instrument_a: str
    instrument_b: str
    symbol_a: str
    symbol_b: str
    correlation: Optional[float] = None
    observations: int = 0
    interpretation: str = ""
    min_observations_met: bool = True
    return_type: str = "simple"
    price_source: str = "adjusted"
    quality_status: str = "GOOD"
    quality_warnings: List[str] = Field(default_factory=list)
    scatter_points: List[ScatterPointItem] = Field(default_factory=list)

class RollingPointItem(BaseModel):
    timestamp: datetime
    correlation: Optional[float] = None

class RollingCorrelationResponse(BaseModel):
    instrument_a: str
    instrument_b: str
    symbol_a: str
    symbol_b: str
    window: int = 60
    return_type: str = "simple"
    price_source: str = "adjusted"
    quality_status: str = "GOOD"
    quality_warnings: List[str] = Field(default_factory=list)
    series: List[RollingPointItem] = Field(default_factory=list)
