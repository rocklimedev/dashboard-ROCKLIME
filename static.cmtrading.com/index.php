<?php
// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Configuration
$product_images_dir = __DIR__ . '/product_images'; // Absolute path to product_images
$base_url = '/product_images/'; // Public URL path
$images_per_page = 12;

// Error handling
try {
    if (!is_dir($product_images_dir)) {
        throw new Exception("Product images directory does not exist.");
    }

    // Scan and filter images
    $all_images = scandir($product_images_dir);
    $images = array_filter($all_images, function($image) use ($product_images_dir) {
        $file_path = $product_images_dir . '/' . $image;
        // Check if it's a file and has valid image extension
        if (!is_file($file_path) || !preg_match('/\.(png|jpg|jpeg)$/i', $image)) {
            return false;
        }
        // Validate image file
        $image_info = @getimagesize($file_path);
        return $image_info !== false;
    });
    $images = array_values($images);

    // Server-side search (case-insensitive)
    $search_query = isset($_GET['search']) ? trim($_GET['search']) : '';
    if ($search_query) {
        $search_query = filter_var($search_query, FILTER_SANITIZE_STRING);
        $images = array_filter($images, function($image) use ($search_query) {
            return stripos($image, $search_query) !== false;
        });
        $images = array_values($images);
    }

    // Pagination
    $total_images = count($images);
    $total_pages = ceil($total_images / $images_per_page);
    $current_page = isset($_GET['page']) ? max(1, filter_var($_GET['page'], FILTER_VALIDATE_INT)) : 1;
    if ($current_page > $total_pages && $total_pages > 0) {
        $current_page = $total_pages;
    }
    $start_index = ($current_page - 1) * $images_per_page;
    $images_to_display = array_slice($images, $start_index, $images_per_page);

    // Pagination range
    $max_pages_to_show = 5;
    $half_window = floor($max_pages_to_show / 2);
    $start_page = max(1, $current_page - $half_window);
    $end_page = min($total_pages, $start_page + $max_pages_to_show - 1);
    if ($end_page - $start_page < $max_pages_to_show - 1) {
        $start_page = max(1, $end_page - $max_pages_to_show + 1);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Product Gallery</title>
    <link rel="stylesheet" href="./style.css">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"
        integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
    body {
        font-family: 'Poppins', sans-serif;
        background-color: #f8f9fa;
    }

    .container {
        max-width: 1200px;
    }

    .product-card {
        transition: transform 0.2s, box-shadow 0.2s;
        cursor: pointer;
        border: none;
        border-radius: 0.5rem;
        overflow: hidden;
    }

    .product-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .card-img-top {
        object-fit: cover;
        height: 200px;
        width: 100%;
    }

    .card-body {
        padding: 1rem;
    }

    .card-title {
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
    }

    .btn-primary,
    .btn-outline-primary {
        border-radius: 0.25rem;
    }

    .modal-content {
        border-radius: 0.5rem;
    }

    .modal-img {
        max-height: 70vh;
        width: 100%;
        object-fit: contain;
    }

    .pagination .page-link {
        border-radius: 0.25rem;
    }

    .pagination .page-item.active .page-link {
        background-color: #007bff;
        border-color: #007bff;
    }

    .text-orange {
        color: #fd7e14;
    }

    @media (max-width: 576px) {
        .card-img-top {
            height: 150px;
        }

        .modal-img {
            max-height: 50vh;
        }
    }
    </style>
</head>

<body>
    <div class="container mt-5">
        <h1 class="fs-3 fw-bold mb-4">Product Gallery</h1>

        <!-- Search Bar -->
        <div class="mb-4">
            <form method="GET" action="">
                <div class="row g-2 align-items-center">
                    <div class="col-sm-8 col-12">
                        <input type="text" id="search" name="search" class="form-control"
                            placeholder="Search products by name" value="<?php echo htmlspecialchars($search_query); ?>"
                            aria-label="Search products">
                    </div>
                    <div class="col-sm-4 col-12">
                        <button type="submit" class="btn btn-primary w-100">Search</button>
                    </div>
                </div>
            </form>
        </div>

        <!-- Product Grid -->
        <?php if (count($images_to_display) > 0): ?>
        <div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
            <?php foreach ($images_to_display as $index => $image): ?>
            <?php
                $name = htmlspecialchars(str_replace(['.png', '.jpg', '.jpeg'], '', $image));
                $name = ucwords(str_replace('_', ' ', $name));
                $modal_id = 'imageModal' . md5($image); // Unique modal ID
                $image_url = $base_url . rawurlencode($image);
            ?>
            <div class="col">
                <div class="card h-100 product-card shadow-sm" data-bs-toggle="modal"
                    data-bs-target="#<?php echo $modal_id; ?>">
                    <img src="<?php echo htmlspecialchars($image_url); ?>" class="card-img-top"
                        alt="<?php echo htmlspecialchars($name); ?>" onerror="this.src='/assets/img/default.jpg'">
                    <div class="card-body">
                        <h6 class="card-title"><?php echo $name; ?></h6>
                        <a href="<?php echo htmlspecialchars($image_url); ?>" class="btn btn-outline-primary btn-sm"
                            download="<?php echo htmlspecialchars($image); ?>"
                            onclick="event.stopPropagation();">Download</a>
                    </div>
                </div>

                <!-- Modal -->
                <div class="modal fade" id="<?php echo $modal_id; ?>" tabindex="-1"
                    aria-labelledby="<?php echo $modal_id; ?>Label" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="<?php echo $modal_id; ?>Label">
                                    <?php echo htmlspecialchars($name); ?>
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"
                                    aria-label="Close"></button>
                            </div>
                            <div class="modal-body text-center">
                                <img src="<?php echo htmlspecialchars($image_url); ?>" class="modal-img"
                                    alt="<?php echo htmlspecialchars($name); ?>"
                                    onerror="this.src='/assets/img/default.jpg'">
                            </div>
                            <div class="modal-footer">
                                <a href="<?php echo htmlspecialchars($image_url); ?>" class="btn btn-primary"
                                    download="<?php echo htmlspecialchars($image); ?>">Download Image</a>
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
        <?php else: ?>
        <div class="text-center mt-4">
            <p class="text-danger fw-bold fs-5">No products found with this search query.</p>
        </div>
        <?php endif; ?>

        <!-- Pagination -->
        <?php if ($total_pages > 1): ?>
        <nav aria-label="Product pagination" class="mt-4">
            <ul class="pagination justify-content-center">
                <li class="page-item <?php if ($current_page <= 1) echo 'disabled'; ?>">
                    <a class="page-link"
                        href="?<?php echo http_build_query(array_merge($_GET, ['page' => $current_page - 1])); ?>"
                        aria-label="Previous">
                        <span aria-hidden="true">&laquo;</span>
                    </a>
                </li>
                <?php if ($start_page > 1): ?>
                <li class="page-item">
                    <a class="page-link"
                        href="?<?php echo http_build_query(array_merge($_GET, ['page' => 1])); ?>">1</a>
                </li>
                <?php if ($start_page > 2): ?>
                <li class="page-item disabled"><span class="page-link">...</span></li>
                <?php endif; ?>
                <?php endif; ?>

                <?php for ($page = $start_page; $page <= $end_page; $page++): ?>
                <li class="page-item <?php if ($current_page == $page) echo 'active'; ?>">
                    <a class="page-link"
                        href="?<?php echo http_build_query(array_merge($_GET, ['page' => $page])); ?>"><?php echo $page; ?></a>
                </li>
                <?php endfor; ?>

                <?php if ($end_page < $total_pages): ?>
                <?php if ($end_page < $total_pages - 1): ?>
                <li class="page-item disabled"><span class="page-link">...</span></li>
                <?php endif; ?>
                <li class="page-item">
                    <a class="page-link"
                        href="?<?php echo http_build_query(array_merge($_GET, ['page' => $total_pages])); ?>"><?php echo $total_pages; ?></a>
                </li>
                <?php endif; ?>

                <li class="page-item <?php if ($current_page >= $total_pages) echo 'disabled'; ?>">
                    <a class="page-link"
                        href="?<?php echo http_build_query(array_merge($_GET, ['page' => $current_page + 1])); ?>"
                        aria-label="Next">
                        <span aria-hidden="true">&raquo;</span>
                    </a>
                </li>
            </ul>
        </nav>
        <?php endif; ?>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
        integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous">
    </script>
    <script>
    // Prevent multiple modal triggers
    document.querySelectorAll('.product-card').forEach(card => {
        let isOpening = false;
        card.addEventListener('click', () => {
            if (isOpening) return;
            isOpening = true;
            setTimeout(() => {
                isOpening = false;
            }, 500);
        });
    });
    </script>
</body>

</html>