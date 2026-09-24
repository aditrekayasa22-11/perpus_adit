<?php

namespace App\Http\Controllers;

use App\Models\Buku;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;

class ExportController extends Controller
{
    /**
     * Export data buku ke Excel (format SpreadsheetML / .xls).
     * GET /api/export/excel
     */
    public function excel(): Response
    {
        $buku = Buku::orderBy('id')->get();

        $rows = '';
        $no   = 1;
        foreach ($buku as $b) {
            $rows .= '<Row>'
                .'<Cell><Data ss:Type="Number">'.$no++.'</Data></Cell>'
                .$this->cell($b->kode_buku)
                .$this->cell($b->judul)
                .$this->cell($b->penulis)
                .$this->cell($b->kategori)
                .$this->cell((string) $b->tahun_terbit)
                .$this->cell($b->penerbit)
                .'</Row>';
        }

        $header = '<Row>'
            .'<Cell ss:StyleID="header"><Data ss:Type="String">NO / ID</Data></Cell>'
            .'<Cell ss:StyleID="header"><Data ss:Type="String">KODE BUKU</Data></Cell>'
            .'<Cell ss:StyleID="header"><Data ss:Type="String">JUDUL</Data></Cell>'
            .'<Cell ss:StyleID="header"><Data ss:Type="String">PENULIS</Data></Cell>'
            .'<Cell ss:StyleID="header"><Data ss:Type="String">KATEGORI</Data></Cell>'
            .'<Cell ss:StyleID="header"><Data ss:Type="String">TAHUN TERBIT</Data></Cell>'
            .'<Cell ss:StyleID="header"><Data ss:Type="String">PENERBIT</Data></Cell>'
            .'</Row>';

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n"
            .'<?mso-application progid="Excel.Sheet"?>'."\n"
            .'<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"'
            .' xmlns:o="urn:schemas-microsoft-com:office:office"'
            .' xmlns:x="urn:schemas-microsoft-com:office:excel"'
            .' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">'."\n"
            .'<Styles>'
            .'<Style ss:ID="header"><Font ss:Bold="1"/>'
            .'<Interior ss:Color="#D9E1F2" ss:Pattern="Solid"/></Style>'
            .'</Styles>'."\n"
            .'<Worksheet ss:Name="Data Buku"><Table>'
            .$header
            .$rows
            .'</Table></Worksheet></Workbook>';

        $filename = 'data_buku_'.date('Ymd_His').'.xls';

        return response($xml, 200, [
            'Content-Type'        => 'application/vnd.ms-excel; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Cache-Control'       => 'no-cache, must-revalidate',
        ]);
    }

    /**
     * Export data buku ke PDF.
     * GET /api/export/pdf
     */
    public function pdf()
    {
        $buku = Buku::orderBy('id')->get();

        $pdf = Pdf::loadView('export.buku_pdf', [
            'buku'  => $buku,
            'total' => $buku->count(),
            'judul' => 'Data Buku Perpustakaan',
            'tanggal' => date('d-m-Y H:i'),
        ])->setPaper('a4', 'landscape');

        return $pdf->download('data_buku_'.date('Ymd_His').'.pdf');
    }

    private function cell(string $value): string
    {
        $safe = htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');

        return '<Cell><Data ss:Type="String">'.$safe.'</Data></Cell>';
    }
}
