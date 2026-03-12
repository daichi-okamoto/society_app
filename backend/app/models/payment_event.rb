class PaymentEvent < ApplicationRecord
  belongs_to :payment

  LEVELS = %w[info warning error].freeze

  validates :event_type, presence: true
  validates :message, presence: true
  validates :level, inclusion: { in: LEVELS }

  scope :recent, -> { order(created_at: :desc) }

  def self.log!(payment:, event_type:, message:, level: "info", metadata: {}, actor_id: nil)
    create!(
      payment: payment,
      event_type: event_type,
      level: level,
      message: message,
      metadata: metadata || {},
      created_by: actor_id
    )
  rescue StandardError => e
    Rails.logger.warn("payment_event_log_failed payment_id=#{payment&.id} event_type=#{event_type} error=#{e.class}:#{e.message}")
  end
end
