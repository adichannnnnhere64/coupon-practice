<?php

namespace App\Services\Delivery;

class DeliveryResult
{
    public function __construct(
        protected bool $success,
        protected ?string $message = null,
        protected array $metadata = [],
        protected ?string $externalReference = null,
    ) {}

    public static function success(string $message = 'Delivery successful', array $metadata = []): self
    {
        return new self(true, $message, $metadata);
    }

    public static function failure(string $message, array $metadata = []): self
    {
        return new self(false, $message, $metadata);
    }

    public function isSuccessful(): bool
    {
        return $this->success;
    }

    public function getMessage(): ?string
    {
        return $this->message;
    }

    public function getMetadata(): array
    {
        return $this->metadata;
    }

    public function getExternalReference(): ?string
    {
        return $this->externalReference;
    }

    public function withExternalReference(string $reference): self
    {
        $this->externalReference = $reference;
        $this->metadata['external_reference'] = $reference;
        return $this;
    }

    public function toArray(): array
    {
        return [
            'success' => $this->success,
            'message' => $this->message,
            'metadata' => $this->metadata,
            'external_reference' => $this->externalReference,
        ];
    }
}
