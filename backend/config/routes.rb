Rails.application.routes.draw do
  devise_for :users, skip: [:sessions, :registrations, :passwords, :confirmations, :unlock]

  post "/auth/register", to: "auth#register"
  post "/auth/login", to: "auth#login"
  post "/auth/logout", to: "auth#logout"

  get "/users/me", to: "users#me"
  patch "/users/me", to: "users#update"

  resources :teams, only: [:index, :create, :show, :update] do
    resources :join_requests, only: [:create, :index], controller: "team_join_requests"
    post "transfer_captain", on: :member
  end
  resources :team_join_requests, only: [:update]

  # Accept dashed routes for join-requests to align with API spec
  get  "/teams/:team_id/join-requests", to: "team_join_requests#index"
  post "/teams/:team_id/join-requests", to: "team_join_requests#create"
  patch "/team-join-requests/:id", to: "team_join_requests#update"
  post "/teams/join-by-code", to: "team_join_requests#join_by_code"
  resources :team_members, only: [:destroy]
  resources :tournaments, only: [:index, :show, :create, :update, :destroy] do
    resources :entries, only: [:create], controller: "tournament_entries"
    resources :matches, only: [:index, :create], controller: "matches"
    resources :images, only: [:index, :create], controller: "tournament_images"
  end
  get "/tournaments/:tournament_id/entries/me", to: "tournament_entries#me"
  resources :tournament_entries, only: [:index, :update] do
    post "cancel", on: :member
  end

  resources :matches, only: [:update] do
    post "result", on: :member
  end

  resources :tournament_images, only: [:destroy]

  get "/exports/insurance", to: "exports#insurance"

  post "/payments/stripe/checkout", to: "payments#checkout"
  post "/payments/:id/refund", to: "payments#refund"
  post "/webhooks/stripe", to: "webhooks#stripe"

  resources :announcements, only: [:index, :create, :destroy]
  resources :messages, only: [:create]

  get "/notifications", to: "notifications#index"
  get "/notifications/history", to: "notifications#history"
  post "/notifications", to: "notifications#create"
  delete "/notifications/:id", to: "notifications#destroy"
  post "/notifications/:id/read", to: "notifications#read"
  get "/notifications/stream", to: "notifications#stream"
  get "/notifications/admin", to: "notifications#admin_index"

  post "/uploads/presign", to: "uploads#presign"

  get "/healthz", to: "health#show"
  get "/readyz", to: "health#ready"
end
