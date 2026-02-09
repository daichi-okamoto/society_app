# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Health", type: :request do
  it "returns ok" do
    get "/healthz"
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body)).to eq("status" => "ok")
  end

  it "returns readiness payload" do
    get "/readyz"

    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body["status"]).to eq("ok")
    expect(body["services"].keys).to contain_exactly("database", "stripe", "r2", "smtp")
    expect(body["services"]["database"]).to eq(true)
  end
end
