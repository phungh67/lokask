module "s3_bucket_storage" {
  source = "github.com/phungh67/customized-terraform-modules//s3-storage"

  bucket-prefix       = "${var.environment_code}${var.region_code}-storage-bucket"
  service_type        = var.service_type
  cors_specified      = var.cors_specified
  policy_specified    = var.policy_specified
  lifecycle_specified = var.life_cycle_specified
}
