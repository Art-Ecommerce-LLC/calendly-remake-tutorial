-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "google_token" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "is_booked" BOOLEAN NOT NULL DEFAULT false,
    "guest_email" TEXT,
    "google_event_id" TEXT,
    "google_token" TEXT NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_id_key" ON "users"("id");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_token_key" ON "users"("google_token");

-- CreateIndex
CREATE UNIQUE INDEX "events_date_key" ON "events"("date");

-- CreateIndex
CREATE UNIQUE INDEX "events_google_event_id_key" ON "events"("google_event_id");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_google_token_fkey" FOREIGN KEY ("google_token") REFERENCES "users"("google_token") ON DELETE RESTRICT ON UPDATE CASCADE;
