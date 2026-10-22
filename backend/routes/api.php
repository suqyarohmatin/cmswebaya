<?php

use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ==========================================
// AUTENTIKASI UMUM
// ==========================================

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// ==========================================
// USER DAN SIDEBAR
// ==========================================

// Login dan registrasi tetap tersedia
Route::post('/register', [UserController::class, 'register']);
Route::post('/login', [UserController::class, 'login']);
Route::post('/verify-user', [UserController::class, 'verifyUser']);

// Pengelolaan pengguna dan sidebar hanya untuk
// SuperAdmin, Admin, serta Operator/Visitor
Route::middleware(['auth:sanctum', 'admin'])->group(function () {

    Route::put('/updateuserbyid/{id}', [
        UserController::class,
        'update'
    ]);

    Route::get('/user/{userId}/sidebars', [
        UserController::class,
        'getUserWithSidebars'
    ]);

    Route::get('/getallusersidebar', [
        UserController::class,
        'getAllUsers'
    ]);

    Route::post('/sidebars/update-status', [
        UserController::class,
        'updateSidebarStatus'
    ]);

    Route::put('/sync-user-sidebars', [
        UserController::class,
        'syncUserSidebars'
    ]);
});

// ==========================================
// KREZOEMA E-COMMERCE
// ==========================================

Route::prefix('ecommerce')->group(function () {

    // --------------------------------------
    // KATALOG PUBLIK
    // --------------------------------------

    Route::get('/categories', [
        \App\Http\Controllers\Ecommerce\CategoryController::class,
        'index'
    ]);

    Route::get('/products', [
        \App\Http\Controllers\Ecommerce\ProductController::class,
        'index'
    ]);

    Route::get('/products/{slug}', [
        \App\Http\Controllers\Ecommerce\ProductController::class,
        'show'
    ]);

    // --------------------------------------
    // AUTENTIKASI CUSTOMER
    // --------------------------------------

    Route::prefix('auth')->group(function () {

        Route::post('/register', [
            \App\Http\Controllers\Ecommerce\CustomerAuthController::class,
            'register'
        ]);

        Route::post('/login', [
            \App\Http\Controllers\Ecommerce\CustomerAuthController::class,
            'login'
        ]);

        Route::middleware('auth:sanctum')->group(function () {

            Route::post('/logout', [
                \App\Http\Controllers\Ecommerce\CustomerAuthController::class,
                'logout'
            ]);

            Route::get('/me', [
                \App\Http\Controllers\Ecommerce\CustomerAuthController::class,
                'me'
            ]);

            Route::put('/profile', [
                \App\Http\Controllers\Ecommerce\CustomerAuthController::class,
                'updateProfile'
            ]);
        });
    });

    // --------------------------------------
    // ALAMAT CUSTOMER
    // --------------------------------------

    Route::middleware('auth:sanctum')->group(function () {

        Route::get('/addresses', [
            \App\Http\Controllers\Ecommerce\CustomerAddressController::class,
            'index'
        ]);

        Route::post('/addresses', [
            \App\Http\Controllers\Ecommerce\CustomerAddressController::class,
            'store'
        ]);

        Route::get('/addresses/{id}', [
            \App\Http\Controllers\Ecommerce\CustomerAddressController::class,
            'show'
        ]);

        Route::put('/addresses/{id}', [
            \App\Http\Controllers\Ecommerce\CustomerAddressController::class,
            'update'
        ]);

        Route::delete('/addresses/{id}', [
            \App\Http\Controllers\Ecommerce\CustomerAddressController::class,
            'destroy'
        ]);

        Route::post('/addresses/{id}/default', [
            \App\Http\Controllers\Ecommerce\CustomerAddressController::class,
            'setDefault'
        ]);
    });

    // --------------------------------------
    // PESANAN CUSTOMER
    // --------------------------------------

    Route::middleware('auth:sanctum')->group(function () {

        Route::get('/orders', [
            \App\Http\Controllers\Ecommerce\OrderController::class,
            'index'
        ]);

        Route::post('/orders', [
            \App\Http\Controllers\Ecommerce\OrderController::class,
            'store'
        ]);

        Route::get('/orders/{id}', [
            \App\Http\Controllers\Ecommerce\OrderController::class,
            'show'
        ]);

        Route::post('/orders/{id}/confirm-payment', [
            \App\Http\Controllers\Ecommerce\OrderController::class,
            'confirmPayment'
        ]);

        Route::post('/orders/{id}/upload-proof', [
            \App\Http\Controllers\Ecommerce\OrderController::class,
            'uploadTransferProof'
        ]);
    });

    // ======================================
    // ADMIN DAN OPERATOR
    //
    // Status 1 = SuperAdmin
    // Status 2 = Admin
    // Status 3 = Operator/Visitor
    //
    // Semua endpoint wajib memakai token
    // dan lolos middleware admin.
    // ======================================

    Route::prefix('admin')
        ->middleware(['auth:sanctum', 'admin'])
        ->group(function () {

            // PRODUK ADMIN

            Route::get('/products/{id}', [
                \App\Http\Controllers\Ecommerce\AdminProductController::class,
                'show'
            ]);

            Route::post('/products', [
                \App\Http\Controllers\Ecommerce\AdminProductController::class,
                'store'
            ]);

            Route::put('/products/{id}', [
                \App\Http\Controllers\Ecommerce\AdminProductController::class,
                'update'
            ]);

            Route::delete('/products/{id}', [
                \App\Http\Controllers\Ecommerce\AdminProductController::class,
                'destroy'
            ]);

            // GAMBAR PRODUK ADMIN

            Route::get('/products/{productId}/images', [
                \App\Http\Controllers\Ecommerce\AdminProductImageController::class,
                'index'
            ]);

            Route::post('/products/{productId}/images', [
                \App\Http\Controllers\Ecommerce\AdminProductImageController::class,
                'store'
            ]);

            Route::delete('/products/{productId}/images/{imageId}', [
                \App\Http\Controllers\Ecommerce\AdminProductImageController::class,
                'destroy'
            ]);

            Route::put('/products/{productId}/images/{imageId}/primary', [
                \App\Http\Controllers\Ecommerce\AdminProductImageController::class,
                'setPrimary'
            ]);

            // KATEGORI ADMIN

            Route::get('/categories', [
                \App\Http\Controllers\Ecommerce\AdminCategoryController::class,
                'index'
            ]);

            Route::post('/categories', [
                \App\Http\Controllers\Ecommerce\AdminCategoryController::class,
                'store'
            ]);

            Route::get('/categories/{id}', [
                \App\Http\Controllers\Ecommerce\AdminCategoryController::class,
                'show'
            ]);

            Route::put('/categories/{id}', [
                \App\Http\Controllers\Ecommerce\AdminCategoryController::class,
                'update'
            ]);

            Route::delete('/categories/{id}', [
                \App\Http\Controllers\Ecommerce\AdminCategoryController::class,
                'destroy'
            ]);

            // PESANAN ADMIN

            Route::get('/orders', [
                \App\Http\Controllers\Ecommerce\AdminOrderController::class,
                'index'
            ]);

            Route::get('/orders/{id}', [
                \App\Http\Controllers\Ecommerce\AdminOrderController::class,
                'show'
            ]);

            Route::put('/orders/{id}', [
                \App\Http\Controllers\Ecommerce\AdminOrderController::class,
                'update'
            ]);
        });
});
