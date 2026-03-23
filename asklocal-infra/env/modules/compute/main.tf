module "ec2-cluster" {
  source                       = "github.com/phungh67/customized-terraform-modules//ec2-lb"
  instance_count               = var.instance_count
  group_name                   = var.group_name
  default_ami_value            = var.base_ami
  vpc_id                       = var.vpc_id
  instance_type                = var.instance_type
  machine_net                  = var.machine_net
  generated_new_ssh_key        = var.generated_new_ssh_key
  default_public_ip_to_machine = var.default_public_ip_to_machine
  open_publicy_ssh             = var.open_publicy_ssh
}