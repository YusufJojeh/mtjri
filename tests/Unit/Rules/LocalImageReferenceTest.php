<?php

namespace Tests\Unit\Rules;

use App\Rules\LocalImageReference;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Validator;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class LocalImageReferenceTest extends TestCase
{
    #[Test]
    public function it_allows_relative_local_image_paths(): void
    {
        $validator = Validator::make([
            'image' => '/storage/media/example.jpg',
        ], [
            'image' => ['required', new LocalImageReference()],
        ]);

        $this->assertFalse($validator->fails());
    }

    #[Test]
    public function it_allows_localhost_absolute_image_urls(): void
    {
        $validator = Validator::make([
            'image' => 'http://127.0.0.1:8000/storage/media/example.jpg',
        ], [
            'image' => ['required', new LocalImageReference()],
        ]);

        $this->assertFalse($validator->fails());
    }

    #[Test]
    public function it_allows_absolute_image_urls_from_the_configured_app_host(): void
    {
        Config::set('app.url', 'https://shop.example.com');

        $validator = Validator::make([
            'image' => 'https://shop.example.com/storage/media/example.jpg',
        ], [
            'image' => ['required', new LocalImageReference()],
        ]);

        $this->assertFalse($validator->fails());
    }

    #[Test]
    public function it_rejects_untrusted_absolute_image_urls(): void
    {
        $validator = Validator::make([
            'image' => 'https://cdn.example.com/storage/media/example.jpg',
        ], [
            'image' => ['required', new LocalImageReference()],
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('image', $validator->errors()->toArray());
    }

    #[Test]
    public function it_rejects_untrusted_urls_in_comma_separated_lists(): void
    {
        $validator = Validator::make([
            'images' => '/storage/media/one.jpg,https://cdn.example.com/two.jpg',
        ], [
            'images' => ['required', new LocalImageReference(true)],
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('images', $validator->errors()->toArray());
    }

    #[Test]
    public function it_allows_the_configured_app_host_in_comma_separated_lists(): void
    {
        Config::set('app.url', 'https://shop.example.com');

        $validator = Validator::make([
            'images' => '/storage/media/one.jpg,https://shop.example.com/storage/media/two.jpg',
        ], [
            'images' => ['required', new LocalImageReference(true)],
        ]);

        $this->assertFalse($validator->fails());
    }
}
