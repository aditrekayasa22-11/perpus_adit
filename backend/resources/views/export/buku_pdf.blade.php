<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>{{ $judul }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Helvetica, Arial, sans-serif; font-size: 10pt; color: #1f2937; }

        .kop { border-bottom: 3px solid #1d4ed8; padding-bottom: 8px; margin-bottom: 14px; }
        .kop h1 { font-size: 16pt; color: #1d4ed8; margin-bottom: 2px; }
        .kop p  { font-size: 9pt; color: #6b7280; }

        .meta { font-size: 9pt; color: #6b7280; margin-bottom: 10px; }

        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #9ca3af; padding: 6px 8px; text-align: left; }
        th { background-color: #dbeafe; font-size: 9pt; }
        td { font-size: 9pt; }
        .center { text-align: center; }

        .footer { margin-top: 16px; font-size: 8pt; color: #9ca3af; text-align: right; }
    </style>
</head>
<body>

    <div class="kop">
        <h1>{{ $judul }}</h1>
        <p>Aplikasi Data Buku Perpustakaan - JSON API &amp; CRUD</p>
    </div>

    <div class="meta">
        Total Data : {{ $total }} buku &nbsp;|&nbsp; Dicetak : {{ $tanggal }}
    </div>

    <table>
        <thead>
            <tr>
                <th width="6%">NO / ID</th>
                <th width="11%">KODE BUKU</th>
                <th width="24%">JUDUL</th>
                <th width="18%">PENULIS</th>
                <th width="13%">KATEGORI</th>
                <th width="11%">TAHUN TERBIT</th>
                <th width="17%">PENERBIT</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($buku as $index => $row)
                <tr>
                    <td class="center">{{ $index + 1 }}</td>
                    <td>{{ $row->kode_buku }}</td>
                    <td>{{ $row->judul }}</td>
                    <td>{{ $row->penulis }}</td>
                    <td>{{ $row->kategori }}</td>
                    <td class="center">{{ $row->tahun_terbit }}</td>
                    <td>{{ $row->penerbit }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="7" class="center">Belum ada data buku.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">Dicetak oleh Admin Perpustakaan</div>

</body>
</html>
