import io
from datetime import datetime
from typing import Any
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether,
)

from app.schemas.report import BacktestReportResponse


def generate_backtest_pdf_report(report: BacktestReportResponse) -> bytes:
    """
    Generates a structured, institutional quantitative research report PDF from BacktestReportResponse DTO.
    Returns bytes of the compiled PDF artifact.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.5 * inch,
        leftMargin=0.5 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch,
    )

    styles = getSampleStyleSheet()

    # Define custom institutional typography styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=2,
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#475569'),
        spaceAfter=10,
    )

    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=12,
        spaceAfter=6,
    )

    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#334155'),
        spaceAfter=4,
    )

    mono_style = ParagraphStyle(
        'MonoCustom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#0F172A'),
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white,
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#1E293B'),
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#0F172A'),
    )

    story = []

    # 1. Header Banner
    story.append(Paragraph("QUANT RESEARCH DASHBOARD — INSTITUTIONAL REPORT", subtitle_style))
    story.append(Paragraph(f"Backtest Research Report: {report.executive_summary.symbol} ({report.executive_summary.strategy_name})", title_style))
    story.append(
        Paragraph(
            f"<b>Report Version:</b> {report.report_version} &nbsp;|&nbsp; "
            f"<b>Generated UTC:</b> {report.generated_at.strftime('%Y-%m-%d %H:%M:%S')} &nbsp;|&nbsp; "
            f"<b>Status:</b> {report.status}",
            subtitle_style
        )
    )
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#CBD5E1'), spaceAfter=10))

    # 2. Executive Summary Table
    story.append(Paragraph("1. Executive Summary", section_heading))

    start_str = report.executive_summary.start_date.strftime('%Y-%m-%d') if report.executive_summary.start_date else 'N/A'
    end_str = report.executive_summary.end_date.strftime('%Y-%m-%d') if report.executive_summary.end_date else 'N/A'
    total_ret_pct = f"{report.executive_summary.total_return * 100:.2f}%"
    ann_ret_str = f"{report.executive_summary.annualized_return * 100:.2f}%" if report.executive_summary.annualized_return is not None else "N/A"
    vol_str = f"{report.executive_summary.annualized_volatility * 100:.2f}%" if report.executive_summary.annualized_volatility is not None else "N/A"
    sharpe_str = f"{report.executive_summary.sharpe_ratio:.2f}" if report.executive_summary.sharpe_ratio is not None else "N/A"
    sortino_str = f"{report.executive_summary.sortino_ratio:.2f}" if report.executive_summary.sortino_ratio is not None else "N/A"
    max_dd_str = f"{report.executive_summary.max_drawdown * 100:.2f}%" if report.executive_summary.max_drawdown is not None else "N/A"
    win_rate_str = f"{report.executive_summary.win_rate * 100:.1f}%" if report.executive_summary.win_rate is not None else "N/A"

    exec_data = [
        [
            Paragraph("Metric", table_header_style),
            Paragraph("Value", table_header_style),
            Paragraph("Metric", table_header_style),
            Paragraph("Value", table_header_style),
        ],
        [
            Paragraph("Target Instrument", table_cell_bold),
            Paragraph(f"{report.executive_summary.symbol} ({report.executive_summary.instrument_name or ''})", table_cell_style),
            Paragraph("Initial Capital", table_cell_bold),
            Paragraph(f"${report.executive_summary.initial_capital:,.2f}", table_cell_style),
        ],
        [
            Paragraph("Simulation Horizon", table_cell_bold),
            Paragraph(f"{start_str} to {end_str}", table_cell_style),
            Paragraph("Final Equity", table_cell_bold),
            Paragraph(f"${report.executive_summary.final_portfolio_value:,.2f}", table_cell_style),
        ],
        [
            Paragraph("Total Return", table_cell_bold),
            Paragraph(total_ret_pct, table_cell_style),
            Paragraph("Annualized Return (CAGR)", table_cell_bold),
            Paragraph(ann_ret_str, table_cell_style),
        ],
        [
            Paragraph("Annualized Volatility", table_cell_bold),
            Paragraph(vol_str, table_cell_style),
            Paragraph("Sharpe Ratio (Rf=0)", table_cell_bold),
            Paragraph(sharpe_str, table_cell_style),
        ],
        [
            Paragraph("Sortino Ratio (MAR=0)", table_cell_bold),
            Paragraph(sortino_str, table_cell_style),
            Paragraph("Maximum Drawdown", table_cell_bold),
            Paragraph(max_dd_str, table_cell_style),
        ],
        [
            Paragraph("Total Completed Trades", table_cell_bold),
            Paragraph(str(report.executive_summary.trade_count), table_cell_style),
            Paragraph("Trade Win Rate", table_cell_bold),
            Paragraph(win_rate_str, table_cell_style),
        ],
    ]

    t_exec = Table(exec_data, colWidths=[1.8 * inch, 1.95 * inch, 1.8 * inch, 1.95 * inch])
    t_exec.setStyle(
        TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E293B')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ])
    )
    story.append(t_exec)

    # 3. Strategy & Execution Assumptions
    story.append(Paragraph("2. Experimental Configuration & Execution Model", section_heading))
    config_data = [
        [
            Paragraph("Parameter", table_header_style),
            Paragraph("Setting", table_header_style),
            Paragraph("Parameter", table_header_style),
            Paragraph("Setting", table_header_style),
        ],
        [
            Paragraph("Strategy Type", table_cell_bold),
            Paragraph(report.strategy.strategy_type, table_cell_style),
            Paragraph("Execution Model", table_cell_bold),
            Paragraph(report.execution_assumptions.execution_model, table_cell_style),
        ],
        [
            Paragraph("MA Type / Windows", table_cell_bold),
            Paragraph(f"{report.strategy.ma_type} ({report.strategy.fast_window}/{report.strategy.slow_window})", table_cell_style),
            Paragraph("Position Sizing", table_cell_bold),
            Paragraph(report.execution_assumptions.position_sizing, table_cell_style),
        ],
        [
            Paragraph("Price Source", table_cell_bold),
            Paragraph(report.strategy.price_source, table_cell_style),
            Paragraph("Commission Rate", table_cell_bold),
            Paragraph(f"{report.cost_assumptions.commission_rate * 100:.2f}%", table_cell_style),
        ],
        [
            Paragraph("Position Direction", table_cell_bold),
            Paragraph(report.strategy.direction, table_cell_style),
            Paragraph("Execution Slippage", table_cell_bold),
            Paragraph(f"{report.cost_assumptions.slippage_rate * 100:.2f}%", table_cell_style),
        ],
    ]

    t_config = Table(config_data, colWidths=[1.8 * inch, 1.95 * inch, 1.8 * inch, 1.95 * inch])
    t_config.setStyle(
        TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E293B')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ])
    )
    story.append(t_config)

    # 4. Performance & Trade Analytics
    story.append(Paragraph("3. Detailed Performance Analytics & Cost Breakdowns", section_heading))
    perf = report.performance
    profit_factor_str = f"{perf.trading.profit_factor:.2f}" if perf.trading.profit_factor is not None else "N/A"
    avg_win_str = f"${perf.trading.average_win:,.2f}" if perf.trading.average_win is not None else "N/A"
    avg_loss_str = f"${perf.trading.average_loss:,.2f}" if perf.trading.average_loss is not None else "N/A"
    calmar_str = f"{perf.drawdown.calmar_ratio:.2f}" if perf.drawdown.calmar_ratio is not None else "N/A"

    perf_data = [
        [
            Paragraph("Category", table_header_style),
            Paragraph("Metric", table_header_style),
            Paragraph("Value", table_header_style),
        ],
        [Paragraph("Trade Statistics", table_cell_bold), Paragraph("Total Completed Trades", table_cell_style), Paragraph(str(perf.trading.trade_count), table_cell_style)],
        [Paragraph("Trade Statistics", table_cell_bold), Paragraph("Win Rate", table_cell_style), Paragraph(win_rate_str, table_cell_style)],
        [Paragraph("Trade Statistics", table_cell_bold), Paragraph("Profit Factor", table_cell_style), Paragraph(profit_factor_str, table_cell_style)],
        [Paragraph("Trade Statistics", table_cell_bold), Paragraph("Average Winning Trade", table_cell_style), Paragraph(avg_win_str, table_cell_style)],
        [Paragraph("Trade Statistics", table_cell_bold), Paragraph("Average Losing Trade", table_cell_style), Paragraph(avg_loss_str, table_cell_style)],
        [Paragraph("Risk & Drawdown", table_cell_bold), Paragraph("Max Drawdown Duration", table_cell_style), Paragraph(f"{perf.drawdown.max_drawdown_duration_days or 0} days", table_cell_style)],
        [Paragraph("Risk & Drawdown", table_cell_bold), Paragraph("Calmar Ratio", table_cell_style), Paragraph(calmar_str, table_cell_style)],
        [Paragraph("Exposure & Costs", table_cell_bold), Paragraph("Position Exposure Fraction", table_cell_style), Paragraph(f"{perf.costs_and_exposure.exposure * 100:.1f}%", table_cell_style)],
        [Paragraph("Exposure & Costs", table_cell_bold), Paragraph("Portfolio Turnover Ratio", table_cell_style), Paragraph(f"{perf.costs_and_exposure.turnover:.2f}x", table_cell_style)],
        [Paragraph("Exposure & Costs", table_cell_bold), Paragraph("Total Transaction Costs", table_cell_style), Paragraph(f"${perf.costs_and_exposure.total_transaction_costs:,.2f}", table_cell_style)],
    ]

    t_perf = Table(perf_data, colWidths=[2.2 * inch, 3.3 * inch, 2.0 * inch])
    t_perf.setStyle(
        TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E293B')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ])
    )
    story.append(t_perf)

    # 5. Drawdown Periods Summary
    if report.drawdown_summary.periods:
        story.append(Paragraph("4. Detected Peak-to-Trough Drawdown Periods", section_heading))
        dd_headers = [
            Paragraph("Peak Date", table_header_style),
            Paragraph("Trough Date", table_header_style),
            Paragraph("Recovery Date", table_header_style),
            Paragraph("Depth (%)", table_header_style),
            Paragraph("Loss ($)", table_header_style),
            Paragraph("Duration", table_header_style),
            Paragraph("Status", table_header_style),
        ]
        dd_rows = [dd_headers]
        for p in report.drawdown_summary.periods[:8]:  # Limit top 8 in PDF
            peak_d = p.peak_timestamp.strftime('%Y-%m-%d') if isinstance(p.peak_timestamp, datetime) else str(p.peak_timestamp).split('T')[0]
            trough_d = p.trough_timestamp.strftime('%Y-%m-%d') if isinstance(p.trough_timestamp, datetime) else str(p.trough_timestamp).split('T')[0]
            rec_d = p.recovery_timestamp.strftime('%Y-%m-%d') if p.recovery_timestamp else "—"
            rec_dur = f"{p.recovery_duration_days}d" if p.recovery_duration_days is not None else "—"

            dd_rows.append([
                Paragraph(peak_d, table_cell_style),
                Paragraph(trough_d, table_cell_style),
                Paragraph(rec_d, table_cell_style),
                Paragraph(f"{p.drawdown_percentage * 100:.2f}%", table_cell_bold),
                Paragraph(f"${p.drawdown_amount:,.0f}", table_cell_style),
                Paragraph(f"{p.duration_days}d", table_cell_style),
                Paragraph(p.status, table_cell_bold),
            ])

        t_dd = Table(dd_rows, colWidths=[1.1 * inch, 1.1 * inch, 1.1 * inch, 1.1 * inch, 1.1 * inch, 1.0 * inch, 1.0 * inch])
        t_dd.setStyle(
            TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E293B')),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
                ('TOPPADDING', (0, 0), (-1, -1), 3),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ])
        )
        story.append(t_dd)

    # 6. Methodology, Limitations & Reproducibility
    story.append(KeepTogether([
        Paragraph("5. Research Methodology & Limitations", section_heading),
        Paragraph("<b>Methodology:</b>", body_style),
        *[Paragraph(f"• {m}", body_style) for m in report.methodology],
        Spacer(1, 4),
        Paragraph("<b>Limitations:</b>", body_style),
        *[Paragraph(f"• {l}", body_style) for l in report.limitations],
        Spacer(1, 8),
        Paragraph("6. Experiment Reproducibility Specification", section_heading),
        Paragraph(f"<b>Backtest ID:</b> {report.reproducibility.backtest_id}", mono_style),
        Paragraph(f"<b>Strategy Configuration ID:</b> {report.reproducibility.strategy_configuration_id}", mono_style),
        Paragraph(f"<b>Instrument ID:</b> {report.reproducibility.instrument_id}", mono_style),
        Paragraph(f"<b>Data Provider / Frequency:</b> {report.reproducibility.provider} ({report.reproducibility.data_frequency})", mono_style),
        Paragraph(f"<b>Deterministic Fingerprint Hash:</b> {report.reproducibility.configuration_hash}", mono_style),
    ]))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
