<?php
// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Configuration
$product_images_dir = './product_images'; // Maps to /public_html/product_images
$images_per_page = 12;

// Error handling
try {
    // Check if directory exists
    if (!is_dir($product_images_dir)) {
        throw new Exception("Product images directory does not exist.");
    }

    // Scan and filter images
    $all_images = scandir($product_images_dir);
    $images = array_filter($all_images, function($image) use ($product_images_dir) {
        return !is_dir($product_images_dir . '/' . $image) && preg_match('/\.(png|jpg|jpeg)$/i', $image);
    });
    $images = array_values($images);

    // Server-side search
    $search_query = isset($_GET['search']) ? trim(strtolower($_GET['search'])) : '';
    if ($search_query) {
        $search_query = filter_var($search_query, FILTER_SANITIZE_STRING);
        $images = array_filter($images, function($image) use ($search_query) {
            return strpos(strtolower($image), $search_query) !== false;
        });
        $images = array_values($images);
    }

    // Pagination
    $total_images = count($images);
    $total_pages = ceil($total_images / $images_per_page);
    $current_page = isset($_GET['page']) ? max(1, filter_var($_GET['page'], FILTER_VALIDATE_INT)) : 1;
    if ($current_page > $total_pages) {
        $current_page = $total_pages;
    }
    $start_index = ($current_page - 1) * $images_per_page;
    $images_to_display = array_slice($images, $start_index, $images_per_page);

    // Pagination range (sliding window)
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
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"
        integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
    <!-- Custom CSS -->
    <link rel="stylesheet" href="style.css">
</head>

<body>
    <div class="container mt-5">
        <h1>Product Gallery</h1>

        <!-- Search Bar -->
        <div class="form-container mb-4">
            <form method="GET" action="">
                <div class="row g-2 align-items-center">
                    <div class="col-8">
                        <input type="text" id="search" name="search" class="form-control"
                            placeholder="Search products by name" value="<?php echo htmlspecialchars($search_query); ?>"
                            aria-label="Search products">
                    </div>
                    <div class="col-4">
                        <button type="submit" class="btn btn-primary w-100">Search</button>
                    </div>
                </div>
            </form>
        </div>

        <!-- Product Grid -->
        <?php if (count($images_to_display) > 0): ?>
        <div class="row">
            <?php foreach ($images_to_display as $index => $image): ?>
            <?php
                    // Simulate product data
                    $name = htmlspecialchars(str_replace(['.png', '.jpg', '.jpeg'], '', $image));
                    $name = " " . ucwords(str_replace('_', ' ', $name));
                  
                 
                    ?>
            <div class="col-5">
                <div class="card h-100 product-card" data-bs-toggle="modal"
                    data-bs-target="#imageModal<?php echo $index; ?>">
                    <img src="<?php echo './product_images/' . urlencode($image); ?>" class="card-img-top"
                        alt="<?php echo $name; ?>">
                    <div class="card-body">
                        <h6 class="card-title"><?php echo $name; ?></h6>

                        <a href="<?php echo './product_images/' . urlencode($image); ?>"
                            class="btn btn-outline-primary btn-sm" target="_blank">View Full</a>
                    </div>
                </div>
                <!-- Modal -->
                <div class="modal fade" id="imageModal<?php echo $index; ?>" tabindex="-1"
                    aria-labelledby="imageModalLabel<?php echo $index; ?>" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="imageModalLabel<?php echo $index; ?>"><?php echo $name; ?>
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"
                                    aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <img src="<?php echo './product_images/' . urlencode($image); ?>" class="img-fluid"
                                    alt="<?php echo $name; ?>">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
        <?php else: ?>
        <div class="text-center">
            <p class="text-muted">No images found.</p>
        </div>
        <?php endif; ?>

        <!-- Pagination -->
        <?php if ($total_pages > 1): ?>
        <nav aria-label="Product pagination" class="mt-4">
            <ul class="pagination">
                <li class="page-item <?php if ($current_page <= 1) echo 'disabled'; ?>">
                    <a class="page-link"
                        href="?<?php echo http_build_query(array_merge($_GET, ['page' => $current_page - 1])); ?>"
                        aria-label="Previous">
                        <span aria-hidden="true">«</span>
                        <span class="sr-only">Previous</span>
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
                        <span aria-hidden="true">»</span>
                        <span class="sr-only">Next</span>
                    </a>
                </li>
            </ul>
        </nav>
        <?php endif; ?>
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
        integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous">
    </script>
</body>

</html>