packer {
  required_plugins {
    amazon = {
      version = ">= 1.2.0"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

source "amazon-ebs" "ubuntu" {
  ami_name      = "${var.environment_indicator}${var.region_code}-${var.ami_prefix}-{{timestamp}}"
  instance_type = var.instance_type
  region        = var.region

  # Base image: Ubuntu 22.04 LTS
  source_ami_filter {
    filters = {
      name                = "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"
      root-device-type    = "ebs"
      virtualization-type = "hvm"
    }
    most_recent = true
    owners      = ["099720109477"] # Canonical
  }
  ssh_username = "ubuntu"
}

build {
  name    = "dev-environment"
  sources = ["source.amazon-ebs.ubuntu"]

  provisioner "shell" {
    inline = [
      # Update system and install net-tools
      "echo '=== Updating system and installing net-tools ==='",
      "sudo apt-get update -y",
      "sudo apt-get install -y net-tools wget curl gnupg",

      # Install Docker
      "echo '=== Installing Docker ==='",
      "sudo apt install ca-certificates curl gnupg",

      "sudo install -m 0755 -d /etc/apt/keyrings",
      "curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg",
      "sudo chmod a+r /etc/apt/keyrings/docker.gpg",
      "echo 'deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable' | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null",
      "sudo apt install y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin",
      "sudo systemctl enable docker",
      "sudo systemctl start docker",

      # 3. Install Go
      "echo '=== Installing Go ==='",
      "wget https://go.dev/dl/go${var.go_version}.linux-amd64.tar.gz",
      "sudo rm -rf /usr/local/go",
      "sudo tar -C /usr/local -xzf go${var.go_version}.linux-amd64.tar.gz",
      "rm go${var.go_version}.linux-amd64.tar.gz",

      # 4. Configure Go PATH for future logins
      "echo 'export PATH=$PATH:/usr/local/go/bin' >> /home/ubuntu/.profile",
      "echo 'export PATH=$PATH:/usr/local/go/bin' >> /home/ubuntu/.bashrc",

      # 5. Verify Installations (Setting PATH explicitly for this script step)
      "echo '=== Verifying Installations ==='",
      "ifconfig --version",
      "docker --version",
      "export PATH=$PATH:/usr/local/go/bin",
      "go version"
    ]
  }
}